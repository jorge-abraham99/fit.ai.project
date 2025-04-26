"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  // ArrowLeft, 
  // ArrowRight, 
  // Check, 
  // ChevronDown, 
  // ChevronUp, 
  Home, 
  // Plus, 
  // ShoppingCart, 
  // X 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { 
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from "@/components/ui/select";
// import { 
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
//   SheetClose
// } from "@/components/ui/sheet";
// import { 
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogClose
// } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client"; // Import Supabase client
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// --- Define types matching the fetched data --- 
type FetchedMeal = {
  name: string;
  recipe: string;
};

type FetchedDayPlan = {
  "Day of Week": string; // Ensure key matches the JSON from Gemini/Pydantic
  Breakfast: FetchedMeal;
  Lunch: FetchedMeal;
  Snacks: string; // Snacks might be just a string
  Dinner: FetchedMeal;
};

// Define the structure of the row fetched from Supabase
type SupabaseMealPlanRow = {
  user_id: string;
  start_date: string; // Assuming DATE is fetched as string
  created_at: string;
  updated_at: string | null;
  monday_meals: FetchedDayPlan | null;
  tuesday_meals: FetchedDayPlan | null;
  wednesday_meals: FetchedDayPlan | null;
  thursday_meals: FetchedDayPlan | null;
  friday_meals: FetchedDayPlan | null;
  saturday_meals: FetchedDayPlan | null;
  sunday_meals: FetchedDayPlan | null;
};

const orderedDayColumns: (keyof SupabaseMealPlanRow)[] = [
  'monday_meals',
  'tuesday_meals',
  'wednesday_meals',
  'thursday_meals',
  'friday_meals',
  'saturday_meals',
  'sunday_meals'
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // State for the fetched meal plan data
  const [mealPlanData, setMealPlanData] = useState<SupabaseMealPlanRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchMealPlan = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        // 1. Get User ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error(userError?.message || "User not logged in.");
        }

        // 2. Fetch meal plan from Supabase
        const { data, error: dbError } = await supabase
          .from('user_weekly_meal_plan')
          .select('*') // Select all columns for now
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle() as user might not have a plan yet

        if (dbError) {
          throw new Error(dbError.message || "Failed to fetch meal plan data.");
        }

        if (data) {
          console.log("Fetched meal plan data:", data);
          setMealPlanData(data as SupabaseMealPlanRow);
            } else {
          console.log("No meal plan found for this user.");
          setMealPlanData(null); // Explicitly set to null if no data
        }

      } catch (error: any) {
        console.error("Error fetching meal plan:", error);
        setFetchError(error.message || "An unexpected error occurred while fetching the meal plan.");
        setMealPlanData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealPlan();
  }, [supabase]);

  // --- Render Functions --- 

  const renderLoading = () => (
    <Card className="p-6 md:p-8 shadow-lg">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="border border-gray-200 p-3">
                    <Skeleton className="h-6 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(7)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(5)].map((_, colIndex) => (
                    <td key={colIndex} className="border border-gray-200 p-3">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  const renderError = () => (
    <Alert variant="destructive">
      <AlertTitle>Error Fetching Meal Plan</AlertTitle>
      <AlertDescription>{fetchError}</AlertDescription>
    </Alert>
  );

  const renderNoPlan = () => (
     <Card className="p-6 md:p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">No Meal Plan Found</h2>
        <p className="text-lg text-gray-600 mb-6">
            It looks like a meal plan hasn't been generated for you yet.
            You might need to complete the questionnaire first.
        </p>
        {/* Optional: Add a button to go back to questionnaire or trigger generation? */} 
        {/* <Button onClick={() => router.push('/questionnaire')}>Complete Questionnaire</Button> */}
     </Card>
  );

  const renderMealPlanTable = () => {
    if (!mealPlanData) return renderNoPlan(); // Should not happen if loading is false and no error

    // Transform the row data into an array of daily plans for easier mapping
    const dailyPlans = orderedDayColumns
        .map(colName => mealPlanData[colName] as FetchedDayPlan | null)
        .filter(plan => plan !== null) as FetchedDayPlan[]; // Filter out nulls and assert type
    
    if (dailyPlans.length === 0) return renderNoPlan(); // Handle case where all days are null

    return (
      <Card className="p-6 md:p-8 shadow-lg overflow-x-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Weekly Meal Plan</h2>
            {/* <p className="text-lg text-gray-600">
              Generated based on your profile. 
              {/* Future: Add swap functionality back here * /}
            </p> */} 
            {mealPlanData.start_date && (
                <p className="text-md text-gray-500">Plan starting from: {new Date(mealPlanData.start_date + 'T00:00:00Z').toLocaleDateString()}</p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border border-gray-200 p-3 text-left text-lg font-medium">Day</th>
                  <th className="border border-gray-200 p-3 text-left text-lg font-medium">Breakfast</th>
                  <th className="border border-gray-200 p-3 text-left text-lg font-medium">Lunch</th>
                  <th className="border border-gray-200 p-3 text-left text-lg font-medium">Snacks</th>
                  <th className="border border-gray-200 p-3 text-left text-lg font-medium">Dinner</th>
                  {/* Removed Nutritional Info & Notes columns as they aren't in the fetched data */}
                </tr>
              </thead>
              <tbody>
                {dailyPlans.map((dayPlan, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3 font-medium text-lg align-top">
                      {dayPlan["Day of Week"]}
                    </td>
                    <td className="border border-gray-200 p-3 align-top">
                      <p className="font-medium text-base">{dayPlan.Breakfast?.name || "N/A"}</p>
                      <p className="text-sm text-gray-600 mt-1">{dayPlan.Breakfast?.recipe || ""}</p>
                    </td>
                    <td className="border border-gray-200 p-3 align-top">
                      <p className="font-medium text-base">{dayPlan.Lunch?.name || "N/A"}</p>
                      <p className="text-sm text-gray-600 mt-1">{dayPlan.Lunch?.recipe || ""}</p>
                    </td>
                    <td className="border border-gray-200 p-3 align-top">
                      <p className="text-base">{dayPlan.Snacks || "N/A"}</p>
                    </td>
                    <td className="border border-gray-200 p-3 align-top">
                       <p className="font-medium text-base">{dayPlan.Dinner?.name || "N/A"}</p>
                       <p className="text-sm text-gray-600 mt-1">{dayPlan.Dinner?.recipe || ""}</p>
                    </td>
                    {/* Removed Nutritional Info & Notes cells */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  };

  // --- Main Return --- 
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
          
          {/* Commented out Shopping List Button for now */}
          {/* <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowShoppingList(true)} // Assuming setShowShoppingList state existed
            >
              <ShoppingCart className="h-5 w-5" />
              Shopping List
            </Button>
          </div> */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? renderLoading() : 
         fetchError ? renderError() : 
         mealPlanData ? renderMealPlanTable() : 
         renderNoPlan()}
      </main>

      {/* Commented out Shopping List Sheet */}
      {/* <Sheet open={showShoppingList} onOpenChange={setShowShoppingList}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          ...
        </SheetContent>
      </Sheet> */}
    </div>
  );
} 