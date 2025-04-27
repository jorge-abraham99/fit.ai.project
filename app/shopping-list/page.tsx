"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ShoppingListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ingredients, setIngredients] = useState<{ ingredient: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error(userError?.message || "User not logged in");

        const { data, error: dbError } = await supabase
          .from("user_weekly_meal_plan")
          .select("ingredients")
          .eq("user_id", user.id)
          .maybeSingle();
        if (dbError) throw new Error(dbError.message || "Could not fetch shopping list");
        setIngredients(data?.ingredients || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50 p-6">
      <Card className="max-w-2xl mx-auto p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-teal-700">Shopping List</h1>
        {loading ? (
          <p>Loading shopping list...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : ingredients.length === 0 ? (
          <p>No shopping list found. Please generate your meal plan first.</p>
        ) : (
          <ul className="space-y-2">
            {ingredients.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between border-b py-2">
                <span className="font-medium">{item.ingredient}</span>
                <span className="text-gray-500">{item.amount}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </Card>
    </div>
  );
}