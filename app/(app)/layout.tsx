import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let theme: "dark" | "light" = "light";
  let privacyBlur = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme, privacy_blur")
      .eq("id", user.id)
      .single();
    if (profile) {
      theme = profile.theme === "light" ? "light" : "dark";
      privacyBlur = profile.privacy_blur;
    }
  }

  return (
    <AppShell initialTheme={theme} initialPrivacyBlur={privacyBlur}>
      {children}
    </AppShell>
  );
}
