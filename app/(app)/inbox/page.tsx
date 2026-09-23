import { Inbox as InboxIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getPendingCaptures } from "@/lib/quickCaptureServer";
import { InboxCard } from "@/app/(app)/today/InboxCard";
import { StrayCaptureRow } from "./StrayCaptureRow";

export const metadata = { title: "Inbox" };

const TRIAGE_TYPES = ["fuel", "expense", "debt_payment"];

export default async function InboxPage() {
  const captures = await getPendingCaptures();
  const triage = captures.filter((c) => TRIAGE_TYPES.includes(c.type));
  const stray = captures.filter((c) => !TRIAGE_TYPES.includes(c.type));

  const supabase = await createClient();
  const [{ data: vehicles }, { data: accounts }, { data: debts }] = await Promise.all([
    supabase.from("vehicles").select("id, make, model"),
    supabase.from("accounts").select("id, name"),
    supabase.from("debts").select("id, creditor").eq("status", "active"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader icon={InboxIcon} color="#0FAE9C" eyebrow="Capture" title="Inbox" />
      <p className="text-sm text-muted">
        Everything you capture quickly lands here first if it needs a decision — pick where it belongs, or clear it.
        Most captures (tasks, notes, appointments, reminders, shopping items, weight) file themselves automatically.
      </p>

      {captures.length === 0 ? (
        <EmptyState icon={InboxIcon} title="Inbox zero" detail="Nothing waiting on you — quick captures are filing themselves." />
      ) : (
        <div className="space-y-2">
          {triage.length > 0 && (
            <InboxCard captures={triage} vehicles={vehicles ?? []} accounts={accounts ?? []} debts={debts ?? []} />
          )}
          {stray.map((capture) => (
            <StrayCaptureRow key={capture.id} capture={capture} />
          ))}
        </div>
      )}
    </div>
  );
}
