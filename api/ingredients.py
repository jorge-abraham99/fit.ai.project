import os
from fastapi import FastAPI, HTTPException, Depends
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import google.generativeai as genai
load_dotenv(dotenv_path=".env.local")

# Supabase configuration
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"
app = FastAPI(
    title="Meal Plan Ingredients API",
    description="Fetches individual recipes from a user's weekly meal plan."
)

# CORS configuration
origins = [
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client dependency
def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase URL or Key not configured.")
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not connect to Supabase: {e}")

# Configure Gemini API
def configure_google_ai():
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key not configured.")
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not configure Google AI: {e}")

configure_google_ai()

# Pydantic model for a recipe
class MealRecipe(BaseModel):
    day_of_week: str
    meal_type: str
    name: str
    recipe: str

class IngredientItem(BaseModel):
    ingredient: str
    amount: str

def get_ingredients(user_id: str, supabase: Client = Depends(get_supabase_client)):
    """Fetches all recipes from the user's weekly meal plan."""
    # Retrieve the weekly plan JSON
    weekdays = [
        "monday_meals", "tuesday_meals", "wednesday_meals", "thursday_meals", "friday_meals", "saturday_meals", "sunday_meals"
    ]
    columns = ",".join(["user_id"] + weekdays)
    resp = supabase.table("user_weekly_meal_plan").select(columns).eq("user_id", user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Meal plan not found for user.")

    recipes: List[MealRecipe] = []
    for idx, weekday in enumerate(weekdays):
        day_meals = resp.data.get(weekday)
        day_name = weekday.replace("_meals", "").capitalize()
        if day_meals and isinstance(day_meals, dict):
            for meal_type, meal in day_meals.items():
                if isinstance(meal, dict):
                    name = meal.get("name")
                    recipe_text = meal.get("recipe")
                    if name and recipe_text:
                        recipes.append(MealRecipe(
                            day_of_week=day_name,
                            meal_type=meal_type,
                            name=name,
                            recipe=recipe_text
                        ))
    return recipes

@app.get("/api/ingredients/{user_id}", response_model=List[MealRecipe])

@app.get("/api/ingredients/{user_id}/list", response_model=List[IngredientItem])
async def generate_shopping_list(user_id: str, supabase: Client = Depends(get_supabase_client)):
    """Generates a consolidated ingredient list with amounts for the user's weekly plan."""
    weekdays = [
        "monday_meals", "tuesday_meals", "wednesday_meals", "thursday_meals", "friday_meals", "saturday_meals", "sunday_meals"
    ]
    columns = ",".join(["user_id"] + weekdays)
    resp = supabase.table("user_weekly_meal_plan").select(columns).eq("user_id", user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Meal plan not found for user.")
    # Build entries for prompt
    recipe_entries: List[str] = []
    for weekday in weekdays:
        day_meals = resp.data.get(weekday)
        day_name = weekday.replace("_meals", "").capitalize()
        if day_meals and isinstance(day_meals, dict):
            for meal_type, meal in day_meals.items():
                if isinstance(meal, dict):
                    name = meal.get("name")
                    recipe_text = meal.get("recipe")
                    if name and recipe_text:
                        recipe_entries.append(f"{meal_type} ({day_name}) - {name}: {recipe_text}")
    # Construct prompt
    prompt = (
        "You are an expert nutritionist and chef. For the following recipes, list all ingredients, note they should be the raw versions "
        "needed with precise amounts in grams, assuming a single serving for each recipe. "
        "Respond ONLY in JSON format as a list of objects with 'ingredient' and 'amount' fields."
        "Make sure they are aggregated and not repeated."
    ) + "\n\n" + "\n\n".join(recipe_entries)
    # Call Gemini model
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```json") and raw.endswith("```"):
            raw = raw[len("```json"):].rstrip("`").strip()
        elif raw.startswith("```") and raw.endswith("```"):
            raw = raw[len("```"):].rstrip("`").strip()
        data = json.loads(raw)
        print("Gemini response data:", data)
        if not isinstance(data, list):
            raise HTTPException(status_code=500, detail="Gemini did not return a list.")
        items = []
        for item in data:
            if not isinstance(item, dict) or "ingredient" not in item or "amount" not in item:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gemini returned an invalid item: {item}"
                )
            amt = item["amount"]
            if isinstance(amt, (int, float)):
                amt_str = f"{amt}g"
            else:
                amt_str = str(amt)
            items.append(IngredientItem(ingredient=item["ingredient"], amount=amt_str))
        # Save the ingredient list to the 'ingredients' column in the table
        try:
            update_resp = supabase.table("user_weekly_meal_plan").update({"ingredients": [item.model_dump() for item in items]}).eq("user_id", user_id).execute()
            if not update_resp.data:
                print(f"Error saving ingredients to Supabase: {update_resp.data}")
                raise HTTPException(status_code=500, detail=f"Failed to save ingredients list to database: {update_resp.data}")
        except Exception as db_exc:
            print(f"Exception during Supabase update: {db_exc}")
            raise HTTPException(status_code=500, detail=f"Database error: {db_exc}")
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingredient generation failed: {e}")
