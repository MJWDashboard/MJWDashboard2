"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchEverything, type SearchResult } from "@/app/(app)/search/actions";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("vorexa:open-search", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("vorexa:open-search", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchEverything(query);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything — tasks, notes, documents, vehicles..."
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
          <button onClick={() => setOpen(false)} aria-label="Close search" className="text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && <p className="px-2 py-3 text-xs text-muted">Searching...</p>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted">No matches for &quot;{query}&quot;.</p>
          )}
          {!loading &&
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted">{category}</p>
                {items.map((item) => (
                  <button
                    key={`${category}-${item.id}`}
                    onClick={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left hover:bg-background"
                  >
                    <span className="text-sm text-text">{item.title}</span>
                    {item.subtitle && <span className="text-xs text-muted">{item.subtitle}</span>}
                  </button>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
