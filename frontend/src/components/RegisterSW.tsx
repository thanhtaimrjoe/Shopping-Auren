"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function RegisterSW() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return;
    }
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
