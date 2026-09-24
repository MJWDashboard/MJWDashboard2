"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, HelpCircle } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { dismissCapture } from "@/lib/quickCaptureServer";

type Capture = Tables<"quick_captures">;

/** Anything left pending that isn't one of the known triage types — should
 * be rare, since most capture kinds auto-file immediately. Gives the user a
 * way to clear it rather than leaving it stuck. */
export function StrayCaptureRow({ capture }: { capture: Capture }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const payload = capture.payload as Record<string, unknown>;
  const summary = String(payload.title ?? payload.text ?? payload.item ?? payload.note ?? "Untitled capture");

  function dismiss() {
    startTransition(async () => {
      await dismissCapture(capture.id);
      router.refresh();
    });
  }

  return (
    <div className="card flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="text-muted" />
        <div>
          <p className="text-sm text-text">{summary}</p>
          <p className="text-xs capitalize text-muted">{capture.type.replace("_", " ")}</p>
        </div>
      </div>
      <button onClick={dismiss} disabled={pending} className="text-muted hover:text-overdue" aria-label="Archive">
        <X size={16} />
      </button>
    </div>
  );
}
