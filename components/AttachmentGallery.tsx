"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Trash2, Upload } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { uploadAttachment, getAttachmentUrl, deleteAttachment } from "@/lib/attachments";

type Attachment = Tables<"attachments">;

export function AttachmentGallery({
  recordTable,
  recordId,
  attachments,
}: {
  recordTable: string;
  recordId: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const result = await uploadAttachment(file, recordTable, recordId);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <Thumbnail key={a.id} attachment={a} onDeleted={() => router.refresh()} />
        ))}
        <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted hover:text-text">
          <Upload size={16} />
          <span className="text-[10px]">{uploading ? "..." : "Add"}</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>
      {error && <p className="text-xs text-overdue">{error}</p>}
    </div>
  );
}

function Thumbnail({ attachment, onDeleted }: { attachment: Attachment; onDeleted: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = attachment.content_type?.startsWith("image/");

  useEffect(() => {
    getAttachmentUrl(attachment.path).then(setUrl);
  }, [attachment.path]);

  return (
    <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
      {url ? (
        isImage ? (
          <a href={url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={attachment.filename} className="h-full w-full object-cover" />
          </a>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
            <Paperclip size={16} />
            <span className="px-1 text-center text-[9px] leading-tight">{attachment.filename}</span>
          </a>
        )
      ) : (
        <div className="h-full w-full animate-pulse bg-border" />
      )}
      <button
        onClick={() => deleteAttachment(attachment.id, attachment.path).then(onDeleted)}
        className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
        aria-label="Delete attachment"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}
