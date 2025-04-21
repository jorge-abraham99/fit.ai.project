"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client"; // Import Supabase client

// Define the form data type
type FormData = {
  wearableDevices: string[];
  otherWearable: string;
  currentWeight: number;
  currentWeightUnit: "kg" | "lbs";
  goalWeight: number;
  goalWeightUnit: "kg" | "lbs";
  height: number;
  heightUnit: "cm" | "inches";
  age: number;
  gender: "male" | "female" | "other";
  medicalConditions: string[];
  otherMedical: string;
  activityLevel: "sedentary" | "light" | "moderate" | "very" | "extra";
  dietaryPreferences: string[];
  otherDietary: string;
  fitnessGoals: string[];
  otherGoals: string;
  timeAvailability: "15min" | "30min" | "45min" | "60min" | "90min";
  sleepQuality: "poor" | "fair" | "good" | "excellent";
  mealPrepTime: "15min" | "30min" | "45min" | "60min";
  cookingSkill: "beginner" | "intermediate" | "advanced";
  allergies: string[];
  otherAllergies: string;
};

// Initial form data
const initialFormData: FormData = {
  wearableDevices: [],
  otherWearable: "",
  currentWeight: 0,
  currentWeightUnit: "kg",
  goalWeight: 0,
  goalWeightUnit: "kg",
  height: 0,
  heightUnit: "cm",
  age: 0,
  gender: "male",
  medicalConditions: [],
  otherMedical: "",
  activityLevel: "moderate",
  dietaryPreferences: [],
  otherDietary: "",
  fitnessGoals: [],
  otherGoals: "",
  timeAvailability: "30min",
  sleepQuality: "good",
  mealPrepTime: "30min",
  cookingSkill: "intermediate",
  allergies: [],
  otherAllergies: "",
};

// Question titles for navigation
const questionTitles = [
  "Wearable Devices",
  "Current Weight",
  "Goal Weight",
  "Height",
  "Age",
  "Gender",
  "Medical Conditions",
  "Activity Level",
  "Dietary Preferences",
  "Fitness Goals",
  "Time Availability",
  "Sleep Quality",
  "Meal Prep Time",
  "Food Allergies",
];

// Define question groups
const questionGroups = [
  {
    title: "Basic Information",
    questions: [1, 2, 3, 4, 5, 6], // Wearable devices, current weight, goal weight, height, age, gender
  },
  {
    title: "Health Information",
    questions: [7, 8, 9, 10, 11], // Medical conditions, activity level, dietary preferences, fitness goals, time availability
  },
  {
    title: "Lifestyle Habits",
    questions: [12, 13, 14], // Sleep quality, meal prep time, food allergies
  },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [progress, setProgress] = useState(0);
  const [showGroupSummary, setShowGroupSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const [submitError, setSubmitError] = useState<string | null>(null); // Add error state

  const supabase = createClient(); // Initialize Supabase client

  const totalSteps = 14; // Updated total steps

  // Update progress when step changes
  const updateProgress = (step: number) => {
    setProgress(Math.round((step / totalSteps) * 100));
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateProgress(nextStep);
      
      const currentGroupQuestions = questionGroups[currentGroup].questions;
      if (currentGroupQuestions.includes(nextStep) === false) {
        setShowGroupSummary(true);
      }
    } else {
      handleSubmit(); // Call submit when on the last step
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (showGroupSummary) {
      setShowGroupSummary(false);
    } else if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateProgress(prevStep);
    }
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);
    setSubmitError(null);
    console.log("Submitting form data:", formData);

    try {
      // 1. Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || "Could not get user information.");
      }

      // 2. Map form data to database column names (snake_case)
      const profileData = {
        id: user.id, // Primary key from auth user
        wearable_devices: formData.wearableDevices,
        other_wearable: formData.otherWearable,
        current_weight: formData.currentWeight,
        current_weight_unit: formData.currentWeightUnit,
        goal_weight: formData.goalWeight,
        goal_weight_unit: formData.goalWeightUnit,
        height: formData.height,
        height_unit: formData.heightUnit,
        age: formData.age,
        gender: formData.gender,
        medical_conditions: formData.medicalConditions,
        other_medical: formData.otherMedical,
        activity_level: formData.activityLevel,
        dietary_preferences: formData.dietaryPreferences,
        other_dietary: formData.otherDietary,
        fitness_goals: formData.fitnessGoals,
        other_goals: formData.otherGoals,
        time_availability: formData.timeAvailability,
        sleep_quality: formData.sleepQuality,
        meal_prep_time: formData.mealPrepTime,
        cooking_skill: formData.cookingSkill,
        allergies: formData.allergies,
        other_allergies: formData.otherAllergies,
        updated_at: new Date().toISOString(), // Set updated_at timestamp
      };

      // 3. Upsert data into the profiles table
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id', // Specify the conflict target
        });

      if (upsertError) {
        console.error("Supabase upsert error:", upsertError);
        throw new Error(upsertError.message || "Failed to save profile data.");
      }

      console.log("Profile data saved successfully for user:", user.id);

      // 4. Redirect to the summary page on success
      router.push("/questionnaire/summary");

    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      setSubmitError(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (
    field: keyof FormData,
    value: string,
    checked: boolean
  ) => {
    const currentValues = formData[field] as string[];

    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(field, currentValues.filter((item) => item !== value));
    }
  };

  // Continue to next group
  const handleContinueToNextGroup = () => {
    setShowGroupSummary(false);
    setCurrentGroup(currentGroup + 1);
    
    // If we've completed all groups, go to the summary page
    if (currentGroup + 1 >= questionGroups.length) {
      handleSubmit();
    }
  };

  // Render group summary
  const renderGroupSummary = () => {
    const group = questionGroups[currentGroup];
    const questions = group.questions;
    
    return (
      <div className="space-y-6 w-full max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">
          {group.title} Summary
        </h2>
        <p className="text-center text-gray-500 text-lg mb-8">
          Here's a summary of your {group.title.toLowerCase()}:
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {questions.map((questionNumber) => {
            const title = questionTitles[questionNumber - 1];
            let value = "";
            
            // Get the value based on the question number
            switch (questionNumber) {
              case 1: // Wearable devices
                value = formData.wearableDevices.length > 0 
                  ? formData.wearableDevices.join(", ") 
                  : "None selected";
                break;
              case 2: // Current weight
                value = `${formData.currentWeight} ${formData.currentWeightUnit}`;
                break;
              case 3: // Goal weight
                value = `${formData.goalWeight} ${formData.goalWeightUnit}`;
                break;
              case 4: // Height
                value = `${formData.height} ${formData.heightUnit}`;
                break;
              case 5: // Age
                value = formData.age.toString();
                break;
              case 6: // Gender
                value = formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1);
                break;
              case 7: // Medical conditions
                value = formData.medicalConditions.length > 0 
                  ? formData.medicalConditions.join(", ") 
                  : "None";
                break;
              case 8: // Activity level
                const activityLabels = {
                  sedentary: "Sedentary",
                  light: "Lightly active",
                  moderate: "Moderately active",
                  very: "Very active",
                  extra: "Extra active"
                };
                value = activityLabels[formData.activityLevel];
                break;
              case 9: // Dietary preferences
                value = formData.dietaryPreferences.length > 0 
                  ? formData.dietaryPreferences.join(", ") 
                  : "None selected";
                break;
              case 10: // Fitness goals
                value = formData.fitnessGoals.length > 0 
                  ? formData.fitnessGoals.join(", ") 
                  : "None selected";
                break;
              case 11: // Time availability
                const timeLabels = {
                  "15min": "15 minutes",
                  "30min": "30 minutes",
                  "45min": "45 minutes",
                  "60min": "60 minutes",
                  "90min": "90 minutes"
                };
                value = timeLabels[formData.timeAvailability];
                break;
              case 12: // Sleep quality
                const sleepLabels = {
                  poor: "Poor",
                  fair: "Fair",
                  good: "Good",
                  excellent: "Excellent"
                };
                value = sleepLabels[formData.sleepQuality];
                break;
              case 13: // Meal prep time
                const prepLabels = {
                  "15min": "15 minutes",
                  "30min": "30 minutes",
                  "45min": "45 minutes",
                  "60min": "60 minutes"
                };
                value = prepLabels[formData.mealPrepTime];
                break;
              case 14: // Food allergies
                value = formData.allergies.length > 0 
                  ? formData.allergies.join(", ") 
                  : "None";
                break;
            }
            
            return (
              <div key={questionNumber} className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-700">{title}:</span>
                <span className="text-gray-900">{value}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleContinueToNextGroup}
            className="bg-teal-600 hover:bg-teal-700 text-lg py-3 px-6"
          >
            Continue
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  };

  // Render the current step
  const renderStep = () => {
    if (showGroupSummary) {
      return renderGroupSummary();
    }
    
    const baseClasses = "space-y-6 w-full max-w-2xl mx-auto"; // Centering and max width
    switch (currentStep) {
      case 1:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What wearable devices do you use?
            </h2>
            <p className="text-center text-gray-500 text-lg">
              Select all that apply
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["Apple Watch", "Fitbit", "Garmin", "Samsung Watch", "Other"].map(
                (device) => (
                  <div key={device} className="flex items-center space-x-3">
                    <Checkbox
                      id={device}
                      checked={formData.wearableDevices.includes(device)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "wearableDevices",
                          device,
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor={device} className="text-lg">
                      {device}
                    </Label>
                  </div>
                )
              )}
            </div>

            {formData.wearableDevices.includes("Other") && (
              <div className="mt-6">
                <Label htmlFor="otherWearable" className="text-lg block mb-2">
                  Please specify:
                </Label>
                <Input
                  id="otherWearable"
                  value={formData.otherWearable}
                  onChange={(e) =>
                    handleInputChange("otherWearable", e.target.value)
                  }
                  placeholder="Enter your wearable device"
                  className="text-lg h-12"
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your current weight?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currentWeight" className="text-lg block mb-2">
                  Weight
                </Label>
                <Input
                  id="currentWeight"
                  type="number"
                  value={formData.currentWeight || ""}
                  onChange={(e) =>
                    handleInputChange("currentWeight", parseFloat(e.target.value))
                  }
                  placeholder="Enter your weight"
                  className="text-lg h-12"
                />
              </div>
              <div>
                <Label htmlFor="currentWeightUnit" className="text-lg block mb-2">
                  Unit
                </Label>
                <Select
                  value={formData.currentWeightUnit}
                  onValueChange={(value) =>
                    handleInputChange("currentWeightUnit", value)
                  }
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your goal weight?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="goalWeight" className="text-lg block mb-2">
                  Weight
                </Label>
                <Input
                  id="goalWeight"
                  type="number"
                  value={formData.goalWeight || ""}
                  onChange={(e) =>
                    handleInputChange("goalWeight", parseFloat(e.target.value))
                  }
                  placeholder="Enter your goal weight"
                  className="text-lg h-12"
                />
              </div>
              <div>
                <Label htmlFor="goalWeightUnit" className="text-lg block mb-2">
                  Unit
                </Label>
                <Select
                  value={formData.goalWeightUnit}
                  onValueChange={(value) =>
                    handleInputChange("goalWeightUnit", value)
                  }
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your height?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="height" className="text-lg block mb-2">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    handleInputChange("height", parseFloat(e.target.value))
                  }
                  placeholder="Enter your height"
                  className="text-lg h-12"
                />
              </div>
              <div>
                <Label htmlFor="heightUnit" className="text-lg block mb-2">
                  Unit
                </Label>
                <Select
                  value={formData.heightUnit}
                  onValueChange={(value) => handleInputChange("heightUnit", value)}
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="inches">inches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your age?
            </h2>

            <div>
              <Label htmlFor="age" className="text-lg block mb-2">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  handleInputChange("age", parseInt(e.target.value))
                }
                placeholder="Enter your age"
                className="text-lg h-12"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your gender?
            </h2>

            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
              className="flex flex-col space-y-4"
            >
              {["male", "female", "other"].map((gender) => (
                <div key={gender} className="flex items-center space-x-3">
                  <RadioGroupItem value={gender} id={gender} className="h-5 w-5" />
                  <Label htmlFor={gender} className="capitalize text-lg">
                    {gender}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 7:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              Do you have any medical conditions?
            </h2>
            <p className="text-center text-gray-500 text-lg">
              Select all that apply
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Diabetes",
                "Hypertension",
                "Heart Disease",
                "Joint Issues",
                "None",
                "Other",
              ].map((condition) => (
                <div key={condition} className="flex items-center space-x-3">
                  <Checkbox
                    id={condition}
                    checked={formData.medicalConditions.includes(condition)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(
                        "medicalConditions",
                        condition,
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor={condition} className="text-lg">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>

            {formData.medicalConditions.includes("Other") && (
              <div className="mt-6">
                <Label htmlFor="otherMedical" className="text-lg block mb-2">
                  Please specify:
                </Label>
                <Input
                  id="otherMedical"
                  value={formData.otherMedical}
                  onChange={(e) =>
                    handleInputChange("otherMedical", e.target.value)
                  }
                  placeholder="Enter your medical condition"
                  className="text-lg h-12"
                />
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What is your activity level?
            </h2>

            <RadioGroup
              value={formData.activityLevel}
              onValueChange={(value) => handleInputChange("activityLevel", value)}
              className="flex flex-col space-y-4"
            >
              {[
                {
                  value: "sedentary",
                  label: "Sedentary (little or no exercise)",
                },
                {
                  value: "light",
                  label: "Lightly active (light exercise 1-3 days/week)",
                },
                {
                  value: "moderate",
                  label: "Moderately active (moderate exercise 3-5 days/week)",
                },
                {
                  value: "very",
                  label: "Very active (hard exercise 6-7 days/week)",
                },
                {
                  value: "extra",
                  label: "Extra active (very hard exercise & physical job)",
                },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="h-5 w-5" />
                  <Label htmlFor={option.value} className="text-lg">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 9:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What are your dietary preferences?
            </h2>
            <p className="text-center text-gray-500 text-lg">
              Select all that apply
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Vegetarian",
                "Vegan",
                "Pescatarian",
                "Keto",
                "Paleo",
                "Gluten-Free",
                "Dairy-Free",
                "Other",
              ].map((preference) => (
                <div key={preference} className="flex items-center space-x-3">
                  <Checkbox
                    id={preference}
                    checked={formData.dietaryPreferences.includes(preference)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(
                        "dietaryPreferences",
                        preference,
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor={preference} className="text-lg">
                    {preference}
                  </Label>
                </div>
              ))}
            </div>

            {formData.dietaryPreferences.includes("Other") && (
              <div className="mt-6">
                <Label htmlFor="otherDietary" className="text-lg block mb-2">
                  Please specify:
                </Label>
                <Input
                  id="otherDietary"
                  value={formData.otherDietary}
                  onChange={(e) =>
                    handleInputChange("otherDietary", e.target.value)
                  }
                  placeholder="Enter your dietary preference"
                  className="text-lg h-12"
                />
              </div>
            )}
          </div>
        );

      case 10:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              What are your fitness goals?
            </h2>
            <p className="text-center text-gray-500 text-lg">
              Select all that apply
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Weight Loss",
                "Muscle Gain",
                "Endurance",
                "Strength",
                "Flexibility",
                "General Health",
                "Other",
              ].map((goal) => (
                <div key={goal} className="flex items-center space-x-3">
                  <Checkbox
                    id={goal}
                    checked={formData.fitnessGoals.includes(goal)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("fitnessGoals", goal, checked as boolean)
                    }
                  />
                  <Label htmlFor={goal} className="text-lg">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>

            {formData.fitnessGoals.includes("Other") && (
              <div className="mt-6">
                <Label htmlFor="otherGoals" className="text-lg block mb-2">
                  Please specify:
                </Label>
                <Input
                  id="otherGoals"
                  value={formData.otherGoals}
                  onChange={(e) => handleInputChange("otherGoals", e.target.value)}
                  placeholder="Enter your fitness goal"
                  className="text-lg h-12"
                />
              </div>
            )}
          </div>
        );

      case 11:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              How much time can you dedicate to exercise?
            </h2>

            <RadioGroup
              value={formData.timeAvailability}
              onValueChange={(value) =>
                handleInputChange("timeAvailability", value)
              }
              className="flex flex-col space-y-4"
            >
              {[
                { value: "15min", label: "15 minutes" },
                { value: "30min", label: "30 minutes" },
                { value: "45min", label: "45 minutes" },
                { value: "60min", label: "60 minutes" },
                { value: "90min", label: "90 minutes" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="h-5 w-5" />
                  <Label htmlFor={option.value} className="text-lg">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 12:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              How would you rate your sleep quality?
            </h2>

            <RadioGroup
              value={formData.sleepQuality}
              onValueChange={(value) => handleInputChange("sleepQuality", value)}
              className="flex flex-col space-y-4"
            >
              {[
                { value: "poor", label: "Poor (less than 6 hours)" },
                { value: "fair", label: "Fair (6-7 hours)" },
                { value: "good", label: "Good (7-8 hours)" },
                { value: "excellent", label: "Excellent (8+ hours)" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="h-5 w-5" />
                  <Label htmlFor={option.value} className="text-lg">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 13:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              How much time can you spend on meal prep?
            </h2>

            <RadioGroup
              value={formData.mealPrepTime}
              onValueChange={(value) => handleInputChange("mealPrepTime", value)}
              className="flex flex-col space-y-4"
            >
              {[
                { value: "15min", label: "15 minutes" },
                { value: "30min", label: "30 minutes" },
                { value: "45min", label: "45 minutes" },
                { value: "60min", label: "60 minutes" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="h-5 w-5" />
                  <Label htmlFor={option.value} className="text-lg">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 14:
        return (
          <div className={baseClasses}>
            <h2 className="text-4xl font-bold text-center mb-4">
              Do you have any food allergies?
            </h2>
            <p className="text-center text-gray-500 text-lg">
              Select all that apply
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Peanuts",
                "Tree Nuts",
                "Milk",
                "Eggs",
                "Soy",
                "Wheat",
                "Fish",
                "Shellfish",
                "None",
                "Other",
              ].map((allergy) => (
                <div key={allergy} className="flex items-center space-x-3">
                  <Checkbox
                    id={allergy}
                    checked={formData.allergies.includes(allergy)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("allergies", allergy, checked as boolean)
                    }
                  />
                  <Label htmlFor={allergy} className="text-lg">
                    {allergy}
                  </Label>
                </div>
              ))}
            </div>

            {formData.allergies.includes("Other") && (
              <div className="mt-6">
                <Label htmlFor="otherAllergies" className="text-lg block mb-2">
                  Please specify:
                </Label>
                <Input
                  id="otherAllergies"
                  value={formData.otherAllergies}
                  onChange={(e) =>
                    handleInputChange("otherAllergies", e.target.value)
                  }
                  placeholder="Enter your allergies"
                  className="text-lg h-12"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <Home className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-teal-600">
              ProjectFit Questionnaire
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-700">
                {showGroupSummary 
                  ? `Group ${currentGroup + 1} Summary` 
                  : `Step ${currentStep} of ${totalSteps}`}
              </span>
              <span className="text-base font-medium text-gray-700">
                {progress}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2">
          <div
            className="bg-teal-600 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 shadow-lg min-h-[600px] flex flex-col">
          <div className="flex-1">{renderStep()}</div>

          {/* Display submit error message */}
          {submitError && (
            <div className="mt-4 text-center text-red-600 font-medium">
              Error: {submitError}
            </div>
          )}

          <div className="mt-8 flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={(currentStep === 1 && !showGroupSummary) || isSubmitting} // Disable if submitting
              className={cn(currentStep === 1 && !showGroupSummary && "invisible", "text-lg py-3 px-6")}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>

            {!showGroupSummary && (
              <Button
                onClick={handleNext}
                disabled={isSubmitting} // Disable if submitting
                className="bg-teal-600 hover:bg-teal-700 text-lg py-3 px-6"
              >
                {isSubmitting ? 'Submitting...' : (currentStep === totalSteps ? (
                  <>
                    Complete
                    <Check className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ))}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}