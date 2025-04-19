"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Check, 
  Home, 
  Plus, 
  ShoppingCart, 
  X,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DeliverySlotSelector } from "@/components/DeliverySlotSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    prepTime: 10,
    notes: ["High protein", "Quick prep"],
    ingredients: ["Greek yogurt", "Mixed berries", "Granola", "Honey", "Almonds"],
    category: "breakfast"
  },
  {
    id: "l1",
    name: "Grilled Chicken Salad",
    description: "Grilled chicken breast, mixed greens, avocado, cherry tomatoes",
    calories: 450,
    protein: 35,
    carbs: 15,
    fats: 25,
    prepTime: 20,
    notes: ["High protein", "Low carb"],
    ingredients: ["Chicken breast", "Mixed greens", "Avocado", "Cherry tomatoes", "Olive oil", "Balsamic vinegar", "Salt", "Pepper"],
    category: "lunch"
  },
  {
    id: "l2",
    name: "Quinoa Bowl",
    description: "Quinoa, roasted vegetables, chickpeas, tahini dressing",
    calories: 420,
    protein: 15,
    carbs: 60,
    fats: 15,
    prepTime: 25,
    notes: ["Vegetarian", "High fiber"],
    ingredients: ["Quinoa", "Broccoli", "Bell peppers", "Chickpeas", "Tahini", "Lemon juice", "Olive oil", "Salt", "Pepper"],
    category: "lunch"
  },
  {
    id: "s1",
    name: "Protein Smoothie",
    description: "Protein powder, banana, almond milk, spinach, almond butter",
    calories: 300,
    protein: 25,
    carbs: 30,
    fats: 10,
    prepTime: 5,
    notes: ["High protein", "Quick prep"],
    ingredients: ["Protein powder", "Banana", "Almond milk", "Spinach", "Almond butter", "Ice"],
    category: "snack"
  },
  {
    id: "s2",
    name: "Hummus and Veggies",
    description: "Hummus, cucumber, carrots, bell peppers",
    calories: 250,
    protein: 8,
    carbs: 25,
    fats: 15,
    prepTime: 10,
    notes: ["Vegetarian", "High fiber"],
    ingredients: ["Hummus", "Cucumber", "Carrots", "Bell peppers"],
    category: "snack"
  },
  {
    id: "d1",
    name: "Salmon with Asparagus",
    description: "Grilled salmon, roasted asparagus, quinoa",
    calories: 550,
    protein: 40,
    carbs: 30,
    fats: 25,
    prepTime: 30,
    notes: ["High protein", "Omega-3"],
    ingredients: ["Salmon fillet", "Asparagus", "Quinoa", "Olive oil", "Lemon", "Dill", "Salt", "Pepper"],
    category: "dinner"
  },
  {
    id: "d2",
    name: "Turkey Meatballs",
    description: "Turkey meatballs, zucchini noodles, marinara sauce",
    calories: 450,
    protein: 35,
    carbs: 20,
    fats: 20,
    prepTime: 35,
    notes: ["High protein", "Low carb"],
    ingredients: ["Ground turkey", "Zucchini", "Marinara sauce", "Egg", "Breadcrumbs", "Parmesan", "Garlic", "Onion", "Basil", "Salt", "Pepper"],
    category: "dinner"
  }
];

// Sample meal plan
const sampleMealPlan: Day[] = [
  {
    id: "monday",
    name: "Monday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[2],
    snack: sampleMeals[4],
    dinner: sampleMeals[6],
    totalCalories: 1650,
    totalProtein: 125,
    totalCarbs: 85,
    totalFats: 80,
    notes: ["High protein day", "Omega-3 rich dinner"]
  },
  {
    id: "tuesday",
    name: "Tuesday",
    breakfast: sampleMeals[1],
    lunch: sampleMeals[3],
    snack: sampleMeals[5],
    dinner: sampleMeals[7],
    totalCalories: 1440,
    totalProtein: 83,
    totalCarbs: 125,
    totalFats: 60,
    notes: ["Vegetarian options", "High fiber day"]
  },
  {
    id: "wednesday",
    name: "Wednesday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[2],
    snack: sampleMeals[4],
    dinner: sampleMeals[6],
    totalCalories: 1650,
    totalProtein: 125,
    totalCarbs: 85,
    totalFats: 80,
    notes: ["High protein day", "Omega-3 rich dinner"]
  },
  {
    id: "thursday",
    name: "Thursday",
    breakfast: sampleMeals[1],
    lunch: sampleMeals[3],
    snack: sampleMeals[5],
    dinner: sampleMeals[7],
    totalCalories: 1440,
    totalProtein: 83,
    totalCarbs: 125,
    totalFats: 60,
    notes: ["Vegetarian options", "High fiber day"]
  },
  {
    id: "friday",
    name: "Friday",
    breakfast: sampleMeals[0],
    lunch: sampleMeals[2],
    snack: sampleMeals[4],
    dinner: sampleMeals[6],
    totalCalories: 1650,
    totalProtein: 125,
    totalCarbs: 85,
    totalFats: 80,
    notes: ["High protein day", "Omega-3 rich dinner"]
  }
];

// Shopping categories
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

export default function ShoppingListPage() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<Day[]>(sampleMealPlan);
  const [shoppingList, setShoppingList] = useState<{[key: string]: string[]}>({});
  const [itemsInStock, setItemsInStock] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeliverySelector, setShowDeliverySelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<{date: Date, timeSlot: string} | null>(null);

  // Load items in stock from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('itemsInStock');
    if (savedItems) {
      setItemsInStock(JSON.parse(savedItems));
    }
  }, []);

  // Save items in stock to localStorage when they change
  useEffect(() => {
    localStorage.setItem('itemsInStock', JSON.stringify(itemsInStock));
  }, [itemsInStock]);

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

  // Filter items based on search term
  const filteredShoppingList = () => {
    if (!searchTerm) return shoppingList;
    
    const filtered: {[key: string]: string[]} = {};
    
    Object.keys(shoppingList).forEach(category => {
      filtered[category] = shoppingList[category].filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    return filtered;
  };

  // Handle delivery slot selection
  const handleDeliveryComplete = (date: Date, timeSlot: string) => {
    setDeliveryDetails({ date, timeSlot });
    setShowDeliverySelector(false);
    setShowConfirmation(true);
  };

  // Handle purchase completion
  const handlePurchaseComplete = () => {
    // Here you would typically send the order to your backend
    console.log("Order completed:", {
      items: Object.entries(shoppingList).flatMap(([category, items]) => 
        items.filter(item => !itemsInStock.includes(item))
      ),
      deliveryDate: deliveryDetails?.date,
      deliveryTimeSlot: deliveryDetails?.timeSlot
    });
    
    // Clear the shopping list and delivery details
    setItemsInStock([]);
    setDeliveryDetails(null);
    setShowConfirmation(false);
    
    // Redirect to dashboard or show success message
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <Home className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-teal-600">Shopping List</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={() => setShowDeliverySelector(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              Purchase Items
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Shopping List</h2>
              <p className="text-lg text-gray-600">
                Ingredients needed for your weekly meal plan, grouped by category.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add item to 'in stock' list"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddToStock();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleAddToStock}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {itemsInStock.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-lg mb-2">Items in Stock</h3>
                <div className="flex flex-wrap gap-2">
                  {itemsInStock.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border"
                    >
                      <span>{item}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 p-0"
                        onClick={() => handleRemoveFromStock(item)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shoppingCategories.map(category => (
                <div key={category} className="bg-white p-4 rounded-md border shadow-sm">
                  <h3 className="font-medium text-lg mb-3">{category}</h3>
                  <ul className="space-y-2">
                    {filteredShoppingList()[category] && filteredShoppingList()[category].map((item, index) => (
                      <li 
                        key={index} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md",
                          isInStock(item) ? "bg-gray-100 line-through text-gray-500" : "bg-gray-50"
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
          </div>
        </Card>
      </main>

      {/* Delivery Slot Selection Dialog */}
      <Dialog open={showDeliverySelector} onOpenChange={setShowDeliverySelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Delivery Slot</DialogTitle>
          </DialogHeader>
          <DeliverySlotSelector 
            onComplete={handleDeliveryComplete}
            onCancel={() => setShowDeliverySelector(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-md border border-green-200 text-center">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-lg font-medium text-green-700">All done! We will send you alerts on your delivery</p>
                <p className="text-sm text-green-600">
                  Delivery scheduled for {deliveryDetails?.date.toLocaleDateString()} at {deliveryDetails?.timeSlot}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Close
              </Button>
              <Button onClick={handlePurchaseComplete}>
                Complete Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 