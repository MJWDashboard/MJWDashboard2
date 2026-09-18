"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createPortfolio } from "./actions";

export function NewPortfolioButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createPortfolio(name);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + New Portfolio
      </button>
      {open && (
        <Modal title="New Portfolio" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Portfolio Name</label>
              <input
                required
                autoFocus
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
