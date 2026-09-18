"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <div className="w-full max-w-lg rounded-card border border-charcoal-700 bg-charcoal-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-charcoal-700 px-5 py-4">
          <h2 className="text-sm font-semibold text-charcoal-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-charcoal-400 hover:bg-charcoal-700 hover:text-charcoal-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
