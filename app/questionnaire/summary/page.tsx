"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Utensils, Loader2, AlertCircle, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Type for the fetched profile data (subset of profiles table relevant here)
type UserProfile = {
  fitness_goals: string[];
  current_weight: number;
  goal_weight: number;
  current_weight_unit: string;
  goal_weight_unit: string;
  meal_prep_time: string;
  dietary_preferences: string[];
  allergies: string[];
  // Add other fields if needed in the future
};

export default function SummaryPage() {
  const router = useRouter();
  const supabase = createClient();

  // State for fetched data, loading, and errors
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for displayed constraints (initialized from profile, can be added to)
  const [displayConstraints, setDisplayConstraints] = useState<string[]>([]);
  const [showAddConstraint, setShowAddConstraint] = useState(false);
  const [newConstraintText, setNewConstraintText] = useState("");

  // State for API call during meal plan generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error(userError?.message || "User not logged in.");
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            fitness_goals,
            current_weight,
            goal_weight,
            current_weight_unit,
            goal_weight_unit,
            meal_prep_time,
            dietary_preferences,
            allergies
          `)
          .eq('id', user.id)
          .single(); // Expecting a single profile

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          if (profileError.code === 'PGRST116') {
             throw new Error("Profile not found. Please complete the questionnaire first.");
          } else {
             throw new Error(profileError.message || "Failed to load profile data.");
          }
        }

        if (data) {
           setProfileData(data as UserProfile);
           // Initialize displayConstraints based on fetched data
           const initialConstraints = formatConstraints(data as UserProfile);
           setDisplayConstraints(initialConstraints);
        } else {
           throw new Error("Profile data is unexpectedly null.");
        }

      } catch (error: any) {
        setFetchError(error.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  // Handle creating plan and proceeding to dashboard
  const handleCreateMealPlan = async () => {
    if (isGenerating || !profileData) return;

    setIsGenerating(true);
    setGenerateError(null);
    console.log("Attempting to generate meal plan...");

    try {
      // 1. Get User ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || "Could not get user information.");
      }

      // --- START: Save Additional Constraints --- 
      console.log("Checking for additional constraints...");
      const initialConstraints = formatConstraints(profileData); // Get constraints derived from profile
      const manuallyAddedConstraints = displayConstraints.filter(
        constraint => !initialConstraints.includes(constraint)
      );

      let additionalConstraintsString: string | null = null;
      if (manuallyAddedConstraints.length > 0) {
        additionalConstraintsString = manuallyAddedConstraints.join(" and ");
        console.log(`Found ${manuallyAddedConstraints.length} additional constraints:`, additionalConstraintsString);

        // Update the profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ additional_constraints: additionalConstraintsString })
          .eq('id', user.id);

        if (updateError) {
          console.error("Error updating additional constraints:", updateError);
          // Decide if this should block meal plan generation or just warn
          setGenerateError(`Failed to save additional constraints: ${updateError.message}. Proceeding without them.`);
          // Or: throw new Error(`Failed to save additional constraints: ${updateError.message}`); 
        } else {
           console.log("Successfully saved additional constraints.");
        }
      } else {
         console.log("No additional constraints to save.");
         // Optional: Ensure the column is null if no constraints were added this time
         // Could add an update here to set it to null if needed, but upsert might handle?
         // For simplicity, we only update if new constraints are present.
      }
      // --- END: Save Additional Constraints --- 

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
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error creating meal plan:", error);
      // Avoid overwriting a potential constraint save error unless it's a new error
      if (!generateError) { 
        setGenerateError(error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle adding the new constraint text to the list
  const saveNewConstraint = () => {
    if (newConstraintText.trim()) {
      setDisplayConstraints([...displayConstraints, newConstraintText.trim()]);
      setNewConstraintText("");
      setShowAddConstraint(false);
    }
  };

  // Handle removing a manually added constraint (only allow removing the last one for simplicity now)
  const removeLastConstraint = () => {
    // Basic check: Only remove if there are more constraints than initially derived
    const initialCount = formatConstraints(profileData).length;
    if (displayConstraints.length > initialCount) {
       setDisplayConstraints(displayConstraints.slice(0, -1));
    }
  };

  // --- Helper to format initial constraints --- 
  const formatConstraints = (profile: UserProfile | null): string[] => {
      if (!profile) return [];
      const constraintsList: string[] = [];
      if (profile.meal_prep_time) {
        constraintsList.push(`Meal Prep Time: ${profile.meal_prep_time.replace('min', ' minutes')}`);
      }
      if (profile.dietary_preferences?.length > 0 && !profile.dietary_preferences.includes("None")) {
        constraintsList.push(`Preferences: ${profile.dietary_preferences.join(', ')}`);
      }
      if (profile.allergies?.length > 0 && !profile.allergies.includes("None")) {
        constraintsList.push(`Allergies: ${profile.allergies.join(', ')}`);
      }
      return constraintsList;
  }

  // --- Helper to format overall summary (excluding constraints here) --- 
  const getFormattedSummary = () => {
    if (!profileData) return null;

    // Format Goal
    const goalString = profileData.fitness_goals?.length > 0 
      ? profileData.fitness_goals.join(' & ') 
      : "Not specified";

    // Format Target Loss (handle potential unit mismatch simply)
    const weightDiff = Math.abs(profileData.goal_weight - profileData.current_weight);
    const targetLossString = `Target weight difference: ${weightDiff.toFixed(1)} ${profileData.current_weight_unit || profileData.goal_weight_unit || 'units'}`;

    return {
      goal: goalString,
      targetLoss: targetLossString,
    };
  };

  const formattedSummary = getFormattedSummary();

  // --- Render Logic --- 

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50 p-8">
        <Card className="p-6 md:p-8 shadow-lg">
           <CardHeader>
             <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
             <Skeleton className="h-5 w-1/2 mx-auto" />
           </CardHeader>
           <CardContent className="space-y-6">
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-full" />
             <div>
               <Skeleton className="h-5 w-1/4 mb-2" />
               <Skeleton className="h-5 w-full mb-1" />
               <Skeleton className="h-5 w-full mb-1" />
               <Skeleton className="h-5 w-3/4" />
             </div>
             <div className="flex justify-center pt-6">
               <Skeleton className="h-12 w-48" />
             </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError || !profileData || !formattedSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Summary</AlertTitle>
          <AlertDescription>{fetchError || "Could not load profile data."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate initial constraint count for remove logic
  const initialConstraintCount = formatConstraints(profileData).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-teal-600">Confirm Your Plan Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Your Goal: {formattedSummary.goal}</CardTitle>
            <CardDescription className="text-lg text-gray-600">
                {formattedSummary.targetLoss}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="mt-8 space-y-6">
                <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Key Constraints & Preferences</h3>
                    {!showAddConstraint && (
                        <Button variant="outline" size="sm" onClick={() => setShowAddConstraint(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Other Constraint
                      </Button>
                  )}
                </div>

                <div className="space-y-3">
                    {displayConstraints.map((constraint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                            <p className="text-lg text-gray-800">{constraint}</p>
                            {/* Simple remove: only allow removing the last added one */}
                            {index === displayConstraints.length - 1 && index >= initialConstraintCount && (
                                <Button variant="ghost" size="icon" onClick={removeLastConstraint} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                      </Button>
                  )}
                </div>
                    ))}
                    
                    {/* Input for adding new constraint */}
                    {showAddConstraint && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-md border border-dashed">
                      <Input
                                placeholder="Enter any other constraint or note..."
                                value={newConstraintText}
                                onChange={(e) => setNewConstraintText(e.target.value)}
                                className="text-lg h-12 flex-1"
                            />
                            <Button size="icon" onClick={saveNewConstraint} disabled={!newConstraintText.trim()}>
                        <Save className="h-5 w-5" />
                      </Button>
                            <Button size="icon" variant="ghost" onClick={() => {setShowAddConstraint(false); setNewConstraintText("");}}>
                                <X className="h-5 w-5" />
                            </Button>
                    </div>
                  )}
              </div>
            </div>

            <div className="pt-6 border-t mt-8">
              <div className="text-center mb-6">
                 <p className="text-md text-gray-600">
                   Based on your inputs, we'll generate a personalized meal plan.
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
                       Generating Plan...
                     </>
                   ) : (
                     <>
                       Generate My Meal Plan
                  <Utensils className="ml-2 h-5 w-5" />
                     </>
                   )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 