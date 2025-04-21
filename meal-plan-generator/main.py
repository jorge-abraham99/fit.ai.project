import os
import re
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, ValidationError
from typing import List, Dict, Any
from supabase import create_client, Client
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from datetime import date # Import date

# Determine the absolute path to the directory containing main.py
script_dir = os.path.dirname(__file__)
# Construct the path to the .env file in the PARENT directory
project_root = os.path.dirname(script_dir)
dotenv_file_path = os.path.join(project_root, '.env.local')

# Load environment variables explicitly from the calculated path
print(f"DEBUG: Attempting to load .env file from project root: {dotenv_file_path}")
found_dotenv = load_dotenv(dotenv_path=dotenv_file_path)
print(f"DEBUG: dotenv file found: {found_dotenv}") # Check if load_dotenv found the file

# ---- START DEBUGGING ----
loaded_google_key = os.environ.get("GOOGLE_API_KEY")
print(f"DEBUG: Value loaded for GOOGLE_API_KEY: '{loaded_google_key}'") # Print the loaded value
# ---- END DEBUGGING ----

# --- Configuration ---
# Read the URL prefixed with NEXT_PUBLIC_ as defined in .env.local
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
# Read the specific Service Role Key (NOT prefixed with NEXT_PUBLIC_)
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL_NAME = "gemini-1.5-flash-latest" # Use the latest 1.5 Flash model

# --- Input/Output Models ---
class GenerateMealPlanRequest(BaseModel):
    user_id: str

class MealItem(BaseModel):
    name: str
    recipe: str

class DailyMealPlan(BaseModel):
    day_of_week: str = Field(..., alias='Day of Week')
    breakfast: MealItem = Field(..., alias='Breakfast')
    lunch: MealItem = Field(..., alias='Lunch')
    snacks: str = Field(..., alias='Snacks')
    dinner: MealItem = Field(..., alias='Dinner')

class WeeklyMealPlan(BaseModel):
    plan: List[DailyMealPlan]

# --- FastAPI App ---
app = FastAPI(
    title="Meal Plan Generator API",
    description="Generates a meal plan using Gemini based on user profile data from Supabase."
)

# --- CORS Configuration ---
# Define allowed origins (adjust if your frontend runs on a different port)
origins = [
    "http://localhost:3000", # Default Next.js dev port
    "http://127.0.0.1:3000",
    # Add your deployed frontend URL here if applicable
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # List of origins allowed
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

# --- Supabase Client Dependency ---
def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"ERROR: Supabase URL or Key check failed. URL='{SUPABASE_URL}', KEY_IS_SET={'Yes' if SUPABASE_KEY else 'No'}")
        raise HTTPException(status_code=500, detail="Supabase URL or Key not configured.")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        raise HTTPException(status_code=500, detail="Could not connect to Supabase.")

# --- Google AI Client Setup ---
def configure_google_ai():
    if not GOOGLE_API_KEY:
        print(f"ERROR: Google API Key check failed. Value is '{GOOGLE_API_KEY}'") # Added detail to error check
        raise HTTPException(status_code=500, detail="Google API Key not configured.")
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        print("DEBUG: Google AI configured successfully.") # Success message
    except Exception as e:
        print(f"Error configuring Google AI: {e}")
        raise HTTPException(status_code=500, detail="Could not configure Google AI.")

configure_google_ai() # Configure on startup

# --- Helper Functions ---
def format_prompt(profile_data: Dict[str, Any]) -> str:
    """Constructs the prompt for the Gemini API."""
    base_prompt = (
        "You are an expert nutritionist. I am going to pass certain characteristics, "
        "and you are going to build me a 7-day meal plan to achieve my goals. "
        "The answer should ONLY be a valid JSON object, specifically a list where each element represents a day. "
        "Each day object must have the following keys: 'Day of Week' (string), 'Breakfast' (object with 'name' and 'recipe' strings), "
        "'Lunch' (object with 'name' and 'recipe' strings), 'Snacks' (string, can be brief), 'Dinner' (object with 'name' and 'recipe' strings). "
        "Do not include any introductory text, explanations, or markdown formatting outside the JSON structure. The entire output must be parseable JSON."
        "\n\nUser Characteristics:\n"
    )

    details = (
        f"Age: {profile_data.get('age', 'N/A')}\n"
        f"Gender: {profile_data.get('gender', 'N/A')}\n"
        f"Current Weight: {profile_data.get('current_weight', 'N/A')} {profile_data.get('current_weight_unit', '')}\n"
        f"Goal Weight: {profile_data.get('goal_weight', 'N/A')} {profile_data.get('goal_weight_unit', '')}\n"
        f"Height: {profile_data.get('height', 'N/A')} {profile_data.get('height_unit', '')}\n"
        f"Medical Conditions: {', '.join(profile_data.get('medical_conditions', ['None']))}\n"
        f"Activity Level: {profile_data.get('activity_level', 'N/A')}\n"
        f"Fitness Goals: {', '.join(profile_data.get('fitness_goals', ['N/A']))}\n"
        f"Meal Prep Time Availability: {profile_data.get('meal_prep_time', 'N/A')}\n"
        f"Dietary Preferences: {', '.join(profile_data.get('dietary_preferences', ['None']))}\n"
        f"Allergies: {', '.join(profile_data.get('allergies', ['None']))}\n"
    )

    return base_prompt + details

# --- API Endpoint ---
@app.post("/generate-meal-plan", status_code=201)
async def generate_meal_plan(
    request: GenerateMealPlanRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """Generates a meal plan based on user ID, saves it to Supabase."""
    user_id = request.user_id
    print(f"Received request for user_id: {user_id}")

    # 1. Fetch user profile data from Supabase
    try:
        profile_response = supabase.table('profiles').select("*").eq('id', user_id).single().execute()
        if not profile_response.data:
            print(f"Profile not found for user_id: {user_id}")
            raise HTTPException(status_code=404, detail="User profile not found.")
        profile_data = profile_response.data
        print(f"Successfully fetched profile for user_id: {user_id}")
    except Exception as e:
        print(f"Error fetching profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {e}")

    # 2. Construct the prompt
    prompt = format_prompt(profile_data)
    print("\n--- Generated Prompt ---")
    print(prompt)
    print("------------------------\n")

    # 3. Call Gemini API
    try:
        print(f"Calling Gemini model: {GEMINI_MODEL_NAME}")
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        raw_response_text = response.text
        print("\n--- Raw Gemini Response ---")
        print(raw_response_text)
        print("---------------------------\n")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API request failed: {e}")

    # 4. Parse and Validate JSON response
    validated_plan: WeeklyMealPlan | None = None
    try:
        cleaned_response_text = raw_response_text.strip()
        if not cleaned_response_text:
            raise json.JSONDecodeError("Received empty response", "", 0)
        if cleaned_response_text.startswith('\ufeff'):
            cleaned_response_text = cleaned_response_text.lstrip('\ufeff')

        json_string_to_parse = cleaned_response_text
        if json_string_to_parse.startswith("```json") and json_string_to_parse.endswith("```"):
            json_string_to_parse = json_string_to_parse[len("```json"):].rstrip('`').strip()
        elif json_string_to_parse.startswith("```") and json_string_to_parse.endswith("```"):
             json_string_to_parse = json_string_to_parse[len("```"):].rstrip('`').strip()

        print(f"DEBUG: Attempting to parse extracted/cleaned JSON string (length {len(json_string_to_parse)}):\n{json_string_to_parse[:500]}...")
        meal_plan_json = json.loads(json_string_to_parse)
        validated_plan = WeeklyMealPlan(plan=meal_plan_json)
        print("Successfully parsed and validated Gemini JSON response.")
    except json.JSONDecodeError as e:
        print(f"Error decoding Gemini JSON response: {e}")
        print("Original Raw response was:\n", raw_response_text)
        print("String we attempted to parse was:\n", json_string_to_parse)
        raise HTTPException(status_code=500, detail=f"Failed to decode JSON from Gemini response: {e}")
    except ValidationError as e:
        print(f"Error validating Gemini JSON structure: {e}")
        print("Parsed JSON was:\n", meal_plan_json)
        raise HTTPException(status_code=500, detail=f"Gemini response JSON structure invalid: {e}")
    except Exception as e:
        print(f"Unexpected error parsing/validating response: {e}")
        print("Original Raw response was:\n", raw_response_text)
        if 'json_string_to_parse' in locals():
             print("String we attempted to parse was:\n", json_string_to_parse)
        raise HTTPException(status_code=500, detail=f"Failed to process Gemini response: {e}")

    if not validated_plan:
         raise HTTPException(status_code=500, detail="Meal plan validation failed unexpectedly.")

    # 5. Format data and save to Supabase
    try:
        print(f"Formatting and upserting meal plan for user_id: {user_id}")

        # --- START: Restructure data for the user's schema ---
        upsert_data = {
            'user_id': user_id,
            'start_date': date.today().isoformat(), # Use today's date as the start day
            'updated_at': 'now()'
        }

        # Map day names to column names and add the JSON for each day
        day_to_column_map = {
            "monday": "monday_meals",
            "tuesday": "tuesday_meals",
            "wednesday": "wednesday_meals",
            "thursday": "thursday_meals",
            "friday": "friday_meals",
            "saturday": "saturday_meals",
            "sunday": "sunday_meals",
        }

        for daily_plan in validated_plan.plan:
            # Ensure the day name from Gemini is lowercase for reliable mapping
            day_name_lower = daily_plan.day_of_week.lower()
            column_name = day_to_column_map.get(day_name_lower)

            if column_name:
                # Store the Pydantic model's dict representation as JSON
                upsert_data[column_name] = daily_plan.dict(by_alias=True)
            else:
                print(f"Warning: Unknown day '{daily_plan.day_of_week}' received from Gemini. Skipping.")

        # Check if we successfully mapped all days (optional but good)
        if len(upsert_data) < 9: # user_id, start_day, updated_at + 7 days = 10 expected keys if all mapped
             print(f"Warning: Not all days were mapped. Upsert data keys: {list(upsert_data.keys())}")
        # --- END: Restructure data --- 

        print("DEBUG: Final upsert data structure:", upsert_data)
        response = supabase.table('user_weekly_meal_plan').upsert(upsert_data).execute()
        print(f"Successfully upserted meal plan for user_id: {user_id}")
        # Optionally check response for errors if needed

    except Exception as e:
        print(f"Error upserting meal plan for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save meal plan to database: {e}")

    return {"message": "Meal plan generated and saved successfully.", "user_id": user_id}

# --- Health Check Endpoint (Optional) ---
@app.get("/")
def read_root():
    return {"status": "Meal Plan Generator API is running"}

# --- Run Locally (for testing) ---
# Use: uvicorn main:app --reload 