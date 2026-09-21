"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, EyeOff, Sun, Moon, Settings, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

export function TopBar({
  privacyBlur,
  onTogglePrivacy,
  theme,
  onToggleTheme,
}: {
  privacyBlur: boolean;
  onTogglePrivacy: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <button
        onClick={onTogglePrivacy}
        aria-label="Toggle privacy blur"
        aria-pressed={privacyBlur}
        className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-1.5 text-xs text-muted hover:text-text"
      >
        {privacyBlur ? <EyeOff size={16} /> : <Eye size={16} />}
        {privacyBlur ? "Blurred" : "Visible"}
      </button>
      <button
        onClick={onToggleTheme}
        aria-label="Toggle theme"
        className="flex items-center justify-center rounded-[10px] border border-border p-1.5 text-muted hover:text-text"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex items-center justify-center rounded-[10px] border border-border p-1.5 text-muted hover:text-text"
      >
        <Settings size={16} />
      </Link>
      <button
        onClick={handleSignOut}
        disabled={pending}
        aria-label="Sign out"
        className="flex items-center justify-center rounded-[10px] border border-border p-1.5 text-muted hover:border-overdue hover:text-overdue"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
