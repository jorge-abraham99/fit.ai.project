"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Home, 
  Plus, 
  ShoppingCart, 
  X 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Define meal type
type Meal = {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  notes: string[];
  ingredients: string[];
  category: "breakfast" | "lunch" | "snack" | "dinner";
};

// Define day type
type Day = {
  id: string;
  name: string;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  notes: string[];
};

// Sample meal data
const sampleMeals: Meal[] = [
  {
    id: "b1",
    name: "Mediterranean Omelette",
    description: "Egg whites, spinach, feta, tomatoes",
    calories: 350,
    protein: 25,
    carbs: 10,
    fats: 20,
    prepTime: 15,
    notes: ["High protein", "Quick prep"],
    ingredients: ["Egg whites", "Spinach", "Feta cheese", "Tomatoes", "Olive oil", "Salt", "Pepper"],
    category: "breakfast"
  },
  {
    id: "b2",
    name: "Greek Yogurt Parfait",
    description: "Greek yogurt, berries, granola, honey",
    calories: 320,
    protein: 20,
    carbs: 40,
    fats: 10,
    prepTime: 5,
    notes: ["High protein", "Quick prep"],
    ingredients: ["Greek yogurt", "Mixed berries", "Granola", "Honey"],
    category: "breakfast"
  },
  {
    id: "b3",
    name: "Avocado Toast",
    description: "Whole grain toast, avocado, poached egg",
    calories: 380,
    protein: 15,
    carbs: 35,
    fats: 22,
    prepTime: 10,
    notes: ["Vegetarian", "Quick prep"],
    ingredients: ["Whole grain bread", "Avocado", "Egg", "Salt", "Pepper", "Red pepper flakes"],
    category: "breakfast"
  },
  {
    id: "l1",
    name: "Miso-Grilled Chicken Salad",
    description: "Grilled chicken, mixed greens, miso dressing",
    calories: 420,
    protein: 35,
    carbs: 15,
    fats: 25,
    prepTime: 20,
    notes: ["High protein", "Japanese flavors"],
    ingredients: ["Chicken breast", "Mixed greens", "Miso paste", "Rice vinegar", "Sesame oil", "Sesame seeds"],
    category: "lunch"
  },
  {
    id: "l2",
    name: "Mediterranean Bowl",
    description: "Quinoa, chickpeas, cucumber, tomatoes, olives, feta",
    calories: 450,
    protein: 18,
    carbs: 55,
    fats: 22,
    prepTime: 15,
    notes: ["Vegetarian", "Mediterranean flavors"],
    ingredients: ["Quinoa", "Chickpeas", "Cucumber", "Tomatoes", "Olives", "Feta cheese", "Olive oil", "Lemon juice", "Herbs"],
    category: "lunch"
  },
  {
    id: "l3",
    name: "Tuna Poke Bowl",
    description: "Sushi rice, tuna, avocado, seaweed, soy sauce",
    calories: 480,
    protein: 30,
    carbs: 45,
    fats: 25,
    prepTime: 15,
    notes: ["High protein", "Japanese flavors"],
    ingredients: ["Sushi rice", "Tuna", "Avocado", "Seaweed", "Soy sauce", "Sesame oil", "Green onions", "Cucumber"],
    category: "lunch"
  },
  {
    id: "s1",
    name: "Almonds + Berries",
    description: "Mixed almonds and berries",
    calories: 200,
    protein: 6,
    carbs: 15,
    fats: 14,
    prepTime: 0,
    notes: ["Quick snack", "No prep"],
    ingredients: ["Almonds", "Mixed berries"],
    category: "snack"
  },
  {
    id: "s2",
    name: "Greek Yogurt with Honey",
    description: "Greek yogurt with a drizzle of honey",
    calories: 180,
    protein: 15,
    carbs: 15,
    fats: 8,
    prepTime: 2,
    notes: ["High protein", "Quick prep"],
    ingredients: ["Greek yogurt", "Honey"],
    category: "snack"
  },
  {
    id: "s3",
    name: "Hummus with Veggies",
    description: "Hummus with carrot and cucumber sticks",
    calories: 220,
    protein: 8,
    carbs: 25,
    fats: 12,
    prepTime: 5,
    notes: ["Vegetarian", "Quick prep"],
    ingredients: ["Hummus", "Carrots", "Cucumber"],
    category: "snack"
  },
  {
    id: "d1",
    name: "Teriyaki Salmon Bowl",
    description: "Salmon, brown rice, broccoli, teriyaki sauce",
    calories: 550,
    protein: 40,
    carbs: 45,
    fats: 25,
    prepTime: 25,
    notes: ["High protein", "Japanese flavors"],
    ingredients: ["Salmon", "Brown rice", "Broccoli", "Teriyaki sauce", "Sesame seeds", "Green onions"],
    category: "dinner"
  },
  {
    id: "d2",
    name: "Mediterranean Grilled Chicken",
    description: "Grilled chicken, quinoa, roasted vegetables",
    calories: 520,
    protein: 45,
    carbs: 40,
    fats: 22,
    prepTime: 30,
    notes: ["High protein", "Mediterranean flavors"],
    ingredients: ["Chicken breast", "Quinoa", "Zucchini", "Bell peppers", "Olive oil", "Lemon juice", "Herbs"],
    category: "dinner"
  },
  {
    id: "d3",
    name: "Vegetarian Buddha Bowl",
    description: "Tofu, quinoa, sweet potato, kale, tahini dressing",
    calories: 480,
    protein: 20,
    carbs: 55,
    fats: 25,
    prepTime: 25,
    notes: ["Vegetarian", "Mediterranean flavors"],
    ingredients: ["Tofu", "Quinoa", "Sweet potato", "Kale", "Tahini", "Lemon juice", "Olive oil", "Salt", "Pepper"],
    category: "dinner"
  }
];

// Sample weekly meal plan
const initialMealPlan: Day[] = [
  {
    id: "monday",
    name: "Monday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[3],
    snack: sampleMeals[6],
    dinner: sampleMeals[9],
    totalCalories: 1520,
    totalProtein: 106,
    totalCarbs: 80,
    totalFats: 82,
    notes: ["Prep time: 20 mins", "Doubles as tomorrow's lunch"]
  },
  {
    id: "tuesday",
    name: "Tuesday",
    breakfast: sampleMeals[1],
    lunch: sampleMeals[4],
    snack: sampleMeals[7],
    dinner: sampleMeals[10],
    totalCalories: 1470,
    totalProtein: 98,
    totalCarbs: 110,
    totalFats: 62,
    notes: ["Prep time: 15 mins"]
  },
  {
    id: "wednesday",
    name: "Wednesday",
    breakfast: sampleMeals[2],
    lunch: sampleMeals[5],
    snack: sampleMeals[8],
    dinner: sampleMeals[11],
    totalCalories: 1460,
    totalProtein: 73,
    totalCarbs: 135,
    totalFats: 72,
    notes: ["Prep time: 15 mins", "Vegetarian day"]
  },
  {
    id: "thursday",
    name: "Thursday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[3],
    snack: sampleMeals[6],
    dinner: sampleMeals[9],
    totalCalories: 1520,
    totalProtein: 106,
    totalCarbs: 80,
    totalFats: 82,
    notes: ["Prep time: 20 mins"]
  },
  {
    id: "friday",
    name: "Friday",
    breakfast: sampleMeals[1],
    lunch: sampleMeals[4],
    snack: sampleMeals[7],
    dinner: sampleMeals[10],
    totalCalories: 1470,
    totalProtein: 98,
    totalCarbs: 110,
    totalFats: 62,
    notes: ["Prep time: 15 mins"]
  },
  {
    id: "saturday",
    name: "Saturday",
    breakfast: sampleMeals[2],
    lunch: sampleMeals[5],
    snack: sampleMeals[8],
    dinner: sampleMeals[11],
    totalCalories: 1460,
    totalProtein: 73,
    totalCarbs: 135,
    totalFats: 72,
    notes: ["Prep time: 15 mins", "Vegetarian day"]
  },
  {
    id: "sunday",
    name: "Sunday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[3],
    snack: sampleMeals[6],
    dinner: sampleMeals[9],
    totalCalories: 1520,
    totalProtein: 106,
    totalCarbs: 80,
    totalFats: 82,
    notes: ["Prep time: 20 mins"]
  }
];

// Shopping list categories
const shoppingCategories = [
  "Proteins",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Pantry",
  "Snacks",
  "Spices"
];

export default function DashboardPage() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<Day[]>(initialMealPlan);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<{[key: string]: string[]}>({});
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [itemsInStock, setItemsInStock] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  // Generate shopping list from meal plan
  useEffect(() => {
    const generateShoppingList = () => {
      const list: {[key: string]: string[]} = {};
      
      // Initialize categories
      shoppingCategories.forEach(category => {
        list[category] = [];
      });
      
      // Collect ingredients from all meals
      mealPlan.forEach(day => {
        [day.breakfast, day.lunch, day.snack, day.dinner].forEach(meal => {
          meal.ingredients.forEach(ingredient => {
            // Categorize ingredients (simplified for demo)
            if (ingredient.includes("chicken") || ingredient.includes("salmon") || ingredient.includes("tuna") || ingredient.includes("egg")) {
              if (!list["Proteins"].includes(ingredient)) {
                list["Proteins"].push(ingredient);
              }
            } else if (ingredient.includes("spinach") || ingredient.includes("broccoli") || ingredient.includes("kale") || ingredient.includes("cucumber") || ingredient.includes("tomato") || ingredient.includes("pepper") || ingredient.includes("zucchini")) {
              if (!list["Vegetables"].includes(ingredient)) {
                list["Vegetables"].push(ingredient);
              }
            } else if (ingredient.includes("berry") || ingredient.includes("avocado")) {
              if (!list["Fruits"].includes(ingredient)) {
                list["Fruits"].push(ingredient);
              }
            } else if (ingredient.includes("rice") || ingredient.includes("quinoa") || ingredient.includes("bread")) {
              if (!list["Grains"].includes(ingredient)) {
                list["Grains"].push(ingredient);
              }
            } else if (ingredient.includes("yogurt") || ingredient.includes("cheese") || ingredient.includes("feta")) {
              if (!list["Dairy"].includes(ingredient)) {
                list["Dairy"].push(ingredient);
              }
            } else if (ingredient.includes("oil") || ingredient.includes("honey") || ingredient.includes("sauce")) {
              if (!list["Pantry"].includes(ingredient)) {
                list["Pantry"].push(ingredient);
              }
            } else if (ingredient.includes("almond") || ingredient.includes("hummus")) {
              if (!list["Snacks"].includes(ingredient)) {
                list["Snacks"].push(ingredient);
              }
            } else if (ingredient.includes("salt") || ingredient.includes("pepper") || ingredient.includes("herb")) {
              if (!list["Spices"].includes(ingredient)) {
                list["Spices"].push(ingredient);
              }
            } else {
              // Default to Pantry for uncategorized items
              if (!list["Pantry"].includes(ingredient)) {
                list["Pantry"].push(ingredient);
              }
            }
          });
        });
      });
      
      setShoppingList(list);
    };
    
    generateShoppingList();
  }, [mealPlan]);

  // Handle meal swap
  const handleMealSwap = (dayId: string, mealType: string, newMeal: Meal) => {
    setMealPlan(prevPlan => {
      const updatedPlan = [...prevPlan];
      const dayIndex = updatedPlan.findIndex(day => day.id === dayId);
      
      if (dayIndex !== -1) {
        // Update the specific meal
        updatedPlan[dayIndex] = {
          ...updatedPlan[dayIndex],
          [mealType]: newMeal
        };
        
        // Recalculate totals
        const day = updatedPlan[dayIndex];
        day.totalCalories = day.breakfast.calories + day.lunch.calories + day.snack.calories + day.dinner.calories;
        day.totalProtein = day.breakfast.protein + day.lunch.protein + day.snack.protein + day.dinner.protein;
        day.totalCarbs = day.breakfast.carbs + day.lunch.carbs + day.snack.carbs + day.dinner.carbs;
        day.totalFats = day.breakfast.fats + day.lunch.fats + day.snack.fats + day.dinner.fats;
      }
      
      return updatedPlan;
    });
    
    // Close the dialog
    setSelectedMeal(null);
    setSelectedDay(null);
    setSelectedMealType(null);
  };

  // Get alternative meals based on category
  const getAlternativeMeals = (category: string) => {
    return sampleMeals.filter(meal => meal.category === category);
  };

  // Add item to "in stock" list
  const handleAddToStock = () => {
    if (newItem.trim() && !itemsInStock.includes(newItem.trim())) {
      setItemsInStock([...itemsInStock, newItem.trim()]);
      setNewItem("");
    }
  };

  // Remove item from "in stock" list
  const handleRemoveFromStock = (item: string) => {
    setItemsInStock(itemsInStock.filter(i => i !== item));
  };

  // Check if an item is in stock
  const isInStock = (item: string) => {
    return itemsInStock.includes(item);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <Home className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-teal-600">Your Meal Plan Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.push("/shopping-list")}
            >
              <ShoppingCart className="h-5 w-5" />
              Shopping List
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 shadow-lg overflow-x-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Weekly Meal Plan</h2>
              <p className="text-lg text-gray-600">
                Click on any meal to swap it with alternatives that match your preferences.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-50">
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Day</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Breakfast</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Lunch</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Snack</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Dinner</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Nutritional Info</th>
                    <th className="border border-gray-200 p-3 text-left text-lg font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {mealPlan.map((day) => (
                    <tr key={day.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 font-medium text-lg">{day.name}</td>
                      <td className="border border-gray-200 p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={() => {
                                setSelectedMeal(day.breakfast);
                                setSelectedDay(day.id);
                                setSelectedMealType("breakfast");
                              }}
                            >
                              <p className="font-medium text-lg">{day.breakfast.name}</p>
                              <p className="text-gray-600">{day.breakfast.description}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Swap Breakfast</DialogTitle>
                              <DialogDescription>
                                Choose an alternative breakfast that matches your preferences.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {getAlternativeMeals("breakfast").map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleMealSwap(day.id, "breakfast", meal)}
                                >
                                  <div>
                                    <p className="font-medium">{meal.name}</p>
                                    <p className="text-sm text-gray-600">{meal.description}</p>
                                    <p className="text-sm text-gray-500">{meal.calories} kcal, {meal.protein}g protein</p>
                                  </div>
                                  <Button size="sm">Select</Button>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={() => {
                                setSelectedMeal(day.lunch);
                                setSelectedDay(day.id);
                                setSelectedMealType("lunch");
                              }}
                            >
                              <p className="font-medium text-lg">{day.lunch.name}</p>
                              <p className="text-gray-600">{day.lunch.description}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Swap Lunch</DialogTitle>
                              <DialogDescription>
                                Choose an alternative lunch that matches your preferences.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {getAlternativeMeals("lunch").map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleMealSwap(day.id, "lunch", meal)}
                                >
                                  <div>
                                    <p className="font-medium">{meal.name}</p>
                                    <p className="text-sm text-gray-600">{meal.description}</p>
                                    <p className="text-sm text-gray-500">{meal.calories} kcal, {meal.protein}g protein</p>
                                  </div>
                                  <Button size="sm">Select</Button>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={() => {
                                setSelectedMeal(day.snack);
                                setSelectedDay(day.id);
                                setSelectedMealType("snack");
                              }}
                            >
                              <p className="font-medium text-lg">{day.snack.name}</p>
                              <p className="text-gray-600">{day.snack.description}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Swap Snack</DialogTitle>
                              <DialogDescription>
                                Choose an alternative snack that matches your preferences.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {getAlternativeMeals("snack").map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleMealSwap(day.id, "snack", meal)}
                                >
                                  <div>
                                    <p className="font-medium">{meal.name}</p>
                                    <p className="text-sm text-gray-600">{meal.description}</p>
                                    <p className="text-sm text-gray-500">{meal.calories} kcal, {meal.protein}g protein</p>
                                  </div>
                                  <Button size="sm">Select</Button>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={() => {
                                setSelectedMeal(day.dinner);
                                setSelectedDay(day.id);
                                setSelectedMealType("dinner");
                              }}
                            >
                              <p className="font-medium text-lg">{day.dinner.name}</p>
                              <p className="text-gray-600">{day.dinner.description}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Swap Dinner</DialogTitle>
                              <DialogDescription>
                                Choose an alternative dinner that matches your preferences.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {getAlternativeMeals("dinner").map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleMealSwap(day.id, "dinner", meal)}
                                >
                                  <div>
                                    <p className="font-medium">{meal.name}</p>
                                    <p className="text-sm text-gray-600">{meal.description}</p>
                                    <p className="text-sm text-gray-500">{meal.calories} kcal, {meal.protein}g protein</p>
                                  </div>
                                  <Button size="sm">Select</Button>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <div className="space-y-1">
                          <p className="font-medium">{day.totalCalories} kcal</p>
                          <p className="text-sm">Protein: {day.totalProtein}g</p>
                          <p className="text-sm">Carbs: {day.totalCarbs}g</p>
                          <p className="text-sm">Fats: {day.totalFats}g</p>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <ul className="list-disc pl-4 space-y-1">
                          {day.notes.map((note, index) => (
                            <li key={index} className="text-sm">{note}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </main>

      {/* Shopping List Sheet */}
      <Sheet open={showShoppingList} onOpenChange={setShowShoppingList}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-2xl">Shopping List</SheetTitle>
            <SheetDescription>
              Ingredients needed for your weekly meal plan, grouped by category.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add item to 'in stock' list"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddToStock}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {itemsInStock.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Items in Stock</h3>
                <div className="flex flex-wrap gap-2">
                  {itemsInStock.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border"
                    >
                      <span>{item}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveFromStock(item)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {shoppingCategories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium text-lg">{category}</h3>
                <ul className="space-y-1">
                  {shoppingList[category] && shoppingList[category].map((item, index) => (
                    <li 
                      key={index} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md",
                        isInStock(item) ? "bg-gray-100 line-through text-gray-500" : "bg-white border"
                      )}
                    >
                      <span>{item}</span>
                      {isInStock(item) ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveFromStock(item)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 p-0"
                          onClick={() => setItemsInStock([...itemsInStock, item])}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <Button 
              className="w-full" 
              onClick={() => setShowShoppingList(false)}
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 