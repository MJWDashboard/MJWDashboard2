"use client";

import { useState, useTransition } from "react";
import { UserPlus, Ticket, ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { clsx } from "clsx";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { addUser, updateTicketStatus } from "./actions";

type SupportTicket = Tables<"support_tickets">;

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export function DeveloperClient({ users, tickets }: { users: UserRow[]; tickets: SupportTicket[] }) {
  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} color="#0FAE9C" eyebrow="Developer" title="Platform admin" />

      <AddUserCard />

      <div className="card space-y-3">
        <p className="text-sm font-medium text-text">Users ({users.length})</p>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <div>
                <p className="text-sm text-text">
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                </p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  u.role === "admin" ? "bg-accent/15 text-accent" : "bg-border text-muted"
                )}
              >
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Ticket size={16} className="text-accent" />
          Fault tickets · {openTickets.length} open
        </div>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted">No tickets logged yet.</p>
        ) : (
          <div className="space-y-2">
            {[...openTickets, ...closedTickets].map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddUserCard() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addUser(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      (document.getElementById("add-user-form") as HTMLFormElement | null)?.reset();
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <UserPlus size={16} className="text-accent" />
        Add a user
      </div>
      <form id="add-user-form" action={submit} className="space-y-2">
        <div className="flex gap-2">
          <input
            name="firstName"
            placeholder="First name"
            className="w-1/2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
          <input
            name="lastName"
            placeholder="Surname"
            className="w-1/2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <input
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="Password (share this with them)"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-overdue">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {done ? "User added" : pending ? "Adding..." : "Add user"}
        </button>
      </form>
      <p className="text-xs text-muted">
        They sign in with this email and password. Their data is theirs alone — nothing here is shared between accounts.
      </p>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const [pending, startTransition] = useTransition();
  const closed = ticket.status === "closed";

  function toggle() {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, closed ? "open" : "closed");
    });
  }

  return (
    <div className={clsx("rounded-xl border border-border p-3", closed && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-muted">{ticket.ticket_number}</p>
          <p className="text-sm font-medium text-text">{ticket.subject}</p>
          <p className="mt-1 text-sm text-muted">{ticket.message}</p>
          <p className="mt-1 text-xs text-muted">
            {ticket.reporter_email} · {new Date(ticket.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted hover:text-text"
        >
          {closed ? <Circle size={12} /> : <CheckCircle2 size={12} className="text-ok" />}
          {closed ? "Reopen" : "Resolve"}
        </button>
      </div>
    </div>
  );
}
