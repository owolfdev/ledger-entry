"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Listen for updates and auto-activate on next reload
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available; could prompt the user. For now, we no-op.
            }
          });
        });
      } catch {
        // Ignore registration failures silently
      }
    };

    register();
  }, []);

  return null;
}
