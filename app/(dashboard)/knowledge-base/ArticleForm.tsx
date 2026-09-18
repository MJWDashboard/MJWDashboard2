"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createArticle, updateArticle, type ArticleInput } from "./actions";

type Article = {
  id: string;
  title: string;
  building_id: string | null;
  category: string | null;
  content: string;
};

const EMPTY: ArticleInput = { title: "", building_id: "", category: "", content: "" };

function toInput(a?: Article | null): ArticleInput {
  if (!a) return EMPTY;
  return {
    title: a.title ?? "",
    building_id: a.building_id ?? "",
    category: a.category ?? "",
    content: a.content ?? "",
  };
}

export function ArticleFormButton({
  article,
  label,
  buildings,
}: {
  article?: Article;
  label: string;
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ArticleInput>(toInput(article));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(article));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = article ? await updateArticle(article.id, values) : await createArticle(values);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={article ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={article ? "Edit Article" : "New Article"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                required
                className="input"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Building (optional)</label>
                <select
                  className="input"
                  value={values.building_id}
                  onChange={(e) => setValues({ ...values, building_id: e.target.value })}
                >
                  <option value="">Portfolio-wide</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  className="input"
                  placeholder="e.g. Access, Procedures"
                  value={values.category}
                  onChange={(e) => setValues({ ...values, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Content (Markdown)</label>
              <textarea
                rows={10}
                className="input font-mono text-xs"
                value={values.content}
                onChange={(e) => setValues({ ...values, content: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
