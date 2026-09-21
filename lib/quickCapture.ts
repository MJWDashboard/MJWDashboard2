import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { autoFileCapture } from "@/lib/quickCaptureServer";

const QUEUE_KEY = "vorexa.quickCaptureQueue";

type QueuedCapture = {
  type: string;
  payload: Record<string, unknown>;
  captured_at: string;
};

function readQueue(): QueuedCapture[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedCapture[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage unavailable (private mode, quota) — the capture already made
    // it to Supabase if we're online, so this is only lost on a hard offline
    // failure with no localStorage, which we can't do much about client-side.
  }
}

/** Saves a quick capture now if online, otherwise queues it for `flushQuickCaptureQueue`. */
export async function queueQuickCapture(type: string, payload: Record<string, unknown>) {
  const entry: QueuedCapture = { type, payload, captured_at: new Date().toISOString() };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    writeQueue([...readQueue(), entry]);
    return;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("quick_captures")
    .insert({ type: entry.type, payload: entry.payload as Json, captured_at: entry.captured_at })
    .select("id")
    .single();

  if (error || !data) {
    // Insert failed for a reason other than "offline" (e.g. a dropped
    // connection mid-request) — queue it rather than losing the capture.
    writeQueue([...readQueue(), entry]);
    return;
  }

  await autoFileCapture(data.id, entry.type, entry.payload);
}

/** Call on reconnect (and once on app load) to push anything captured offline. */
export async function flushQuickCaptureQueue() {
  const queue = readQueue();
  if (queue.length === 0) return;

  const supabase = createClient();
  const remaining: QueuedCapture[] = [];

  for (const entry of queue) {
    const { data, error } = await supabase
      .from("quick_captures")
      .insert({ type: entry.type, payload: entry.payload as Json, captured_at: entry.captured_at })
      .select("id")
      .single();
    if (error || !data) {
      remaining.push(entry);
      continue;
    }
    await autoFileCapture(data.id, entry.type, entry.payload);
  }

  writeQueue(remaining);
}

export function pendingQuickCaptureCount() {
  return readQueue().length;
}
