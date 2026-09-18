"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

export function ArticleViewerButton({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="font-medium text-cyan-400 hover:underline">
        {title}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm text-charcoal-100">
            {content}
          </pre>
        </Modal>
      )}
    </>
  );
}
