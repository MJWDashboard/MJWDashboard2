"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveWeeklyReview(input: {
  week_start: string;
  wins_note: string;
  challenges_note: string;
  priorities_next_week: string;
  overall_rating: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_reviews")
    .upsert(input, { onConflict: "owner_id,week_start" });
  revalidatePath("/insights");
  return { error: error?.message ?? null };
}

export async function saveMonthlyReview(input: {
  review_month: string;
  net_worth_note: string;
  spending_note: string;
  goals_note: string;
  focus_next_month: string;
  overall_rating: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reviews")
    .upsert(input, { onConflict: "owner_id,review_month" });
  revalidatePath("/insights");
  return { error: error?.message ?? null };
}
