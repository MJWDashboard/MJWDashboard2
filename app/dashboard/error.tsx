"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errorReporting";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: "dashboard" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-lg font-semibold text-charcoal-100">Something went wrong</h2>
      <p className="max-w-sm text-sm text-charcoal-400">
        This has been logged. Try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/dashboard" className="btn-secondary">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
