"use client";

import { useState, useTransition } from "react";
import { User, Lock, Mail } from "lucide-react";
import { updateName, updatePassword } from "./actions";

export function SettingsClient({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Settings</p>
        <h1 className="text-xl font-semibold text-text">Your account</h1>
      </div>

      <div className="card flex items-center gap-3">
        <Mail size={16} className="text-muted" />
        <div>
          <p className="text-xs text-muted">Signed in as</p>
          <p className="text-sm text-text">{email}</p>
        </div>
      </div>

      <NameForm initialFirstName={firstName} initialLastName={lastName} />
      <PasswordForm />
    </div>
  );
}

function NameForm({ initialFirstName, initialLastName }: { initialFirstName: string; initialLastName: string }) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateName(firstName.trim(), lastName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <User size={16} className="text-accent" />
        Name
      </div>
      <div className="flex gap-2">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Surname"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {saved ? "Saved" : pending ? "Saving..." : "Save name"}
      </button>
    </div>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPassword("");
      setConfirm("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Lock size={16} className="text-accent" />
        Password
      </div>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="New password"
        autoComplete="new-password"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-overdue">{error}</p>}
      <button onClick={save} disabled={pending || !password} className="btn-primary w-full">
        {saved ? "Password updated" : pending ? "Updating..." : "Update password"}
      </button>
    </div>
  );
}
