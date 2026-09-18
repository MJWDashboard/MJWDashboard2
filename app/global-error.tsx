"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errorReporting";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal-950 px-4 text-center">
          <h2 className="text-lg font-semibold text-charcoal-100">Something went wrong</h2>
          <p className="max-w-sm text-sm text-charcoal-400">
            This has been logged. Try reloading the page.
          </p>
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
