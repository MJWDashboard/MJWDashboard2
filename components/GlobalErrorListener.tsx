"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errorReporting";

export function GlobalErrorListener() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError(event.error ?? event.message, { kind: "window.onerror" });
    }
    function onRejection(event: PromiseRejectionEvent) {
      reportClientError(event.reason, { kind: "unhandledrejection" });
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
