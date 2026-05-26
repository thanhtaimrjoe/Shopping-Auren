"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Applies native shell tweaks when running inside Capacitor (Android/iOS).
 */
export function CapacitorNative() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#10B981" });
      } catch {
        // Status bar APIs are Android-focused; ignore on unsupported platforms.
      }
      try {
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }
    };

    void init();
  }, []);

  return null;
}
