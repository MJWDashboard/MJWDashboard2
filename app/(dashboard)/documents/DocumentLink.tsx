"use client";

import { useState } from "react";
import { getDocumentUrl } from "./actions";

export function DocumentLink({ path, fileName }: { path: string; fileName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { url } = await getDocumentUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button onClick={handleClick} disabled={loading} className="text-cyan-400 hover:underline">
      {loading ? "Opening…" : fileName}
    </button>
  );
}
