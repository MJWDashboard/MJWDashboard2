"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { globalSearch, type SearchResult } from "@/lib/search";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const found = await globalSearch(query);
      setResults(found);
      setLoading(false);
      setOpen(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-md border border-charcoal-700 bg-charcoal-900 px-3 py-1.5">
        <Search size={15} className="text-charcoal-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search tenants, buildings, meetings…"
          className="w-full bg-transparent text-sm text-charcoal-100 outline-none placeholder:text-charcoal-500"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-md border border-charcoal-700 bg-charcoal-900 shadow-xl">
          {loading && <p className="p-3 text-xs text-charcoal-400">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="p-3 text-xs text-charcoal-400">No matches for &quot;{query}&quot;.</p>
          )}
          {!loading &&
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="border-b border-charcoal-700 last:border-0">
                <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-charcoal-500">
                  {type}
                </p>
                <ul className="pb-1">
                  {items.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        onClick={() => goTo(r.href)}
                        className="flex w-full flex-col items-start px-3 py-1.5 text-left text-sm text-charcoal-100 hover:bg-charcoal-800"
                      >
                        <span>{r.label}</span>
                        {r.sublabel && <span className="text-xs text-charcoal-400">{r.sublabel}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
