import Link from "next/link";

export function FilterChip({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
      <span>Filtered by: {label}</span>
      <Link href={clearHref} className="text-cyan-400 hover:text-cyan-200">
        ✕
      </Link>
    </div>
  );
}
