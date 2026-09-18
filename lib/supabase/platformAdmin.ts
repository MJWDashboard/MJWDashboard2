import { SupabaseClient } from "@supabase/supabase-js";

export async function isPlatformAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
