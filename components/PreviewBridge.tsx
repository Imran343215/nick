"use client";

import { useEffect } from "react";

/**
 * PreviewBridge — listens for theme-preview messages posted by the admin
 * Theme Customizer's live preview iframe and applies the given CSS variable
 * overrides (plus optional Google Fonts) to the document instantly, so
 * unsaved edits are visible without a reload or a save.
 */
export interface PreviewMessage {
  type: "theme-preview";
  /** Full "custom-property name → value" map, e.g. { "--bg": "#fff" }. */
  cssVars: Record<string, string>;
  fonts?: { body: string; display: string };
}

export default function PreviewBridge() {
  useEffect(() => {
    function applyFonts(body: string, display: string) {
      const fam = (name: string) =>
        encodeURIComponent(name).replace(/%20/g, "+");
      const href = `https://fonts.googleapis.com/css2?family=${fam(
        body
      )}:wght@400;500;600;700&family=${fam(display)}:wght@500;600;700&display=swap`;
      let link = document.getElementById(
        "preview-google-fonts"
      ) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "preview-google-fonts";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as PreviewMessage | undefined;
      if (!data || data.type !== "theme-preview") return;

      const style = document.documentElement.style;
      Object.entries(data.cssVars ?? {}).forEach(([name, value]) => {
        style.setProperty(name, String(value));
      });

      if (data.fonts?.body && data.fonts?.display) {
        applyFonts(data.fonts.body, data.fonts.display);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
