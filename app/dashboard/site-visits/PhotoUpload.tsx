"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { uploadSiteVisitPhoto, removeSiteVisitPhoto } from "./actions";

type Photo = {
  id: string;
  file_path: string;
  caption: string | null;
};

export function PhotoGallery({
  itemId,
  siteVisitId,
  photos,
  signedUrls,
}: {
  itemId: string;
  siteVisitId: string;
  photos: Photo[];
  signedUrls: Record<string, string>;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      await uploadSiteVisitPhoto(itemId, siteVisitId, formData);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removeSiteVisitPhoto(id, siteVisitId);
    router.refresh();
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <div key={p.id} className="group relative h-20 w-20 overflow-hidden rounded border border-charcoal-600">
            {signedUrls[p.file_path] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signedUrls[p.file_path]} alt={p.caption ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-charcoal-800 text-xs text-charcoal-400">
                …
              </div>
            )}
            <button
              onClick={() => handleRemove(p.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-charcoal-600 text-charcoal-400 hover:border-cyan-500 hover:text-cyan-400">
          <Camera size={18} />
          <span className="text-[10px]">{uploading ? "Uploading…" : "Add Photo"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
