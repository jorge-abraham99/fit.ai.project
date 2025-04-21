"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Edit2, Save, Utensils, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Define the summary data type
type SummaryData = {
  goal: string;
  targetLoss: string;
  dailyCalorieTarget: string;
  protein: string;
  carbohydrates: string;
  fats: string;
  constraints: string[];
};

// Initial summary data (would be generated based on questionnaire responses)
const initialSummaryData: SummaryData = {
  goal: "Fat loss with muscle gain (recomposition)",
  targetLoss: "~2kg fat in 12 weeks = 0.15–0.2 kg/week",
  dailyCalorieTarget: "~2,350 kcal/day, based on your 2,600 kcal average burn",
  protein: "~2g per kg = ~150g/day",
  carbohydrates: "Moderate, mostly complex and timed post-workout",
  fats: "Healthy fats from olive oil, nuts, oily fish",
  constraints: [
    "Quick prep (15–30 mins)",
    "Mediterranean + Japanese flavours",
    "Minimal gluten and refined carbs",
    "Two fasted mornings per week",
    "One cheat day per week",
    "Meals should double up for next-day lunch"
  ]
};

export default function SummaryPage() {
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<SummaryData>(initialSummaryData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [tempConstraint, setTempConstraint] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const supabase = createClient();

  // Handle editing a field
  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  // Handle saving a field
  const handleSave = () => {
    if (editingField) {
      setSummaryData({
        ...summaryData,
        [editingField]: tempValue
      });
      setEditingField(null);
    }
  };

  // Handle editing a constraint
  const handleEditConstraint = (index: number, value: string) => {
    setEditingConstraint(index);
    setTempConstraint(value);
  };

  // Handle saving a constraint
  const handleSaveConstraint = () => {
    if (editingConstraint !== null) {
      const newConstraints = [...summaryData.constraints];
      newConstraints[editingConstraint] = tempConstraint;
      setSummaryData({
        ...summaryData,
        constraints: newConstraints
      });
      setEditingConstraint(null);
    }
  };

  // Handle adding a new constraint
  const handleAddConstraint = () => {
    setSummaryData({
      ...summaryData,
      constraints: [...summaryData.constraints, "New constraint"]
    });
  };

  // Handle removing a constraint
  const handleRemoveConstraint = (index: number) => {
    const newConstraints = [...summaryData.constraints];
    newConstraints.splice(index, 1);
    setSummaryData({
      ...summaryData,
      constraints: newConstraints
    });
  };

  // Handle creating plan and proceeding to dashboard
  const handleCreateMealPlan = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerateError(null);
    console.log("Attempting to generate meal plan with data:", summaryData);

    try {
      // 1. Get User ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || "Could not get user information.");
      }

      // 2. Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_MEAL_PLAN_API_URL;
      if (!apiUrl) {
        throw new Error("Meal plan generator API URL is not configured.");
      }

      // 3. Call the FastAPI endpoint
      console.log(`Calling API: ${apiUrl}/generate-meal-plan for user: ${user.id}`);
      const response = await fetch(`${apiUrl}/generate-meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", result);
        throw new Error(result.detail || `API request failed with status ${response.status}`);
      }

      console.log("Meal plan generated successfully:", result);

      // 4. Redirect to dashboard on success
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error creating meal plan:", error);
      setGenerateError(error.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-teal-600">Your Plan Summary</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 shadow-lg">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center">Review Your Personalized Plan</h2>
              <p className="text-lg text-center text-gray-600 mb-8">
                Review and edit your plan summary below. Click any field to make changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">Goal</Label>
                  {editingField === "goal" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("goal", summaryData.goal)}
                    >
                      <p className="text-lg">{summaryData.goal}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-lg font-medium">Target Loss</Label>
                  {editingField === "targetLoss" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("targetLoss", summaryData.targetLoss)}
                    >
                      <p className="text-lg">{summaryData.targetLoss}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-lg font-medium">Daily Calorie Target</Label>
                  {editingField === "dailyCalorieTarget" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("dailyCalorieTarget", summaryData.dailyCalorieTarget)}
                    >
                      <p className="text-lg">{summaryData.dailyCalorieTarget}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">Protein</Label>
                  {editingField === "protein" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("protein", summaryData.protein)}
                    >
                      <p className="text-lg">{summaryData.protein}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-lg font-medium">Carbohydrates</Label>
                  {editingField === "carbohydrates" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("carbohydrates", summaryData.carbohydrates)}
                    >
                      <p className="text-lg">{summaryData.carbohydrates}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-lg font-medium">Fats</Label>
                  {editingField === "fats" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-lg h-12"
                      />
                      <Button size="icon" onClick={handleSave}>
                        <Save className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEdit("fats", summaryData.fats)}
                    >
                      <p className="text-lg">{summaryData.fats}</p>
                      <Edit2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-medium">Constraints</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddConstraint}
                  className="text-base"
                >
                  Add Constraint
                </Button>
              </div>
              
              <div className="space-y-3">
                {summaryData.constraints.map((constraint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {editingConstraint === index ? (
                      <>
                        <Input
                          value={tempConstraint}
                          onChange={(e) => setTempConstraint(e.target.value)}
                          className="text-lg h-12"
                        />
                        <Button size="icon" onClick={handleSaveConstraint}>
                          <Save className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => setEditingConstraint(null)}
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div 
                          className="flex-1 flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                          onClick={() => handleEditConstraint(index, constraint)}
                        >
                          <p className="text-lg">{constraint}</p>
                          <Edit2 className="h-5 w-5 text-gray-500" />
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handleRemoveConstraint(index)}
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t mt-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium mb-2">Instructions</h3>
                <p className="text-lg text-gray-600">
                  Review your plan summary above. Click any field to edit your preferences or details.
                  Once satisfied, click Create Meal Plan to proceed to your personalized meal plan dashboard.
                </p>
              </div>
              
              {generateError && (
                <div className="mb-4 text-center text-red-600 font-medium">
                  Error generating meal plan: {generateError}
                </div>
              )}
              
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="bg-teal-600 hover:bg-teal-700 text-lg py-6 px-8"
                  onClick={handleCreateMealPlan}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Create Meal Plan
                      <Utensils className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
} 