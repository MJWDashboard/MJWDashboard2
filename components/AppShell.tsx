"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { LifeSheet } from "./LifeSheet";
import { IdleLock } from "./IdleLock";
import { createClient } from "@/lib/supabase/client";
import { flushQuickCaptureQueue } from "@/lib/quickCapture";

const SENSITIVE_PREFIXES = ["/health", "/vault"];

export function AppShell({
  children,
  initialTheme,
  initialPrivacyBlur,
}: {
  children: React.ReactNode;
  initialTheme: "dark" | "light";
  initialPrivacyBlur: boolean;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [theme, setTheme] = useState(initialTheme);
  const [privacyBlur, setPrivacyBlur] = useState(initialPrivacyBlur);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [lifeOpen, setLifeOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    flushQuickCaptureQueue();
    window.addEventListener("online", flushQuickCaptureQueue);
    return () => window.removeEventListener("online", flushQuickCaptureQueue);
  }, []);

  async function togglePrivacy() {
    const next = !privacyBlur;
    setPrivacyBlur(next);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({ privacy_blur: next }).eq("id", data.user.id);
    }
  }

  async function persistTheme(next: "dark" | "light") {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({ theme: next }).eq("id", data.user.id);
    }
  }

  const isSensitive = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p));
  const content = (
    <div className={clsx(privacyBlur && "privacy-blur")}>
      <TopBar
        privacyBlur={privacyBlur}
        onTogglePrivacy={togglePrivacy}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === "dark" ? "light" : "dark";
          setTheme(next);
          persistTheme(next);
        }}
      />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 lg:pb-8">{children}</main>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        {isSensitive ? <IdleLock>{content}</IdleLock> : content}
      </div>

      <BottomNav onOpenCapture={() => setCaptureOpen(true)} onOpenLife={() => setLifeOpen(true)} />
      {captureOpen && <QuickCaptureSheet onClose={() => setCaptureOpen(false)} />}
      {lifeOpen && <LifeSheet onClose={() => setLifeOpen(false)} />}
    </div>
  );
}
