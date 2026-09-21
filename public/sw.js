// Minimal service worker: satisfies PWA installability. Offline support for
// data entry is handled by the quick-capture localStorage queue in the app,
// not by caching here — this stays a plain network passthrough.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
