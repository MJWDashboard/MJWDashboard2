"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      <LogOut size={18} />
      Sign out
    </button>
  );
}
