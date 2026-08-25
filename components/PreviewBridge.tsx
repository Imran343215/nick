"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * PreviewBridge — wraps the landing page and listens for theme-preview
 * messages posted by the admin Theme Customizer's live preview iframe.
 * It applies CSS variable overrides instantly and exposes content
 * overrides (e.g. an unsaved hero image URL) to client components
 * through usePreviewOverrides().
 */
export interface PreviewMessage {
  type: "theme-preview";
  /** Full "custom-property name → value" map, e.g. { "--bg": "#fff" }. */
  cssVars: Record<string, string>;
  fonts?: { body: string; display: string };
  /** Unsaved hero image URL ("") to clear back to none. */
  heroImage?: string;
}

interface PreviewOverrides {
  heroImage?: string;
}

const PreviewCtx = createContext<PreviewOverrides>({});

/** Client components read live (unsaved) preview overrides from here. */
export function usePreviewOverrides(): PreviewOverrides {
  return useContext(PreviewCtx);
}

export default function PreviewBridge({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<PreviewOverrides>({});

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

      if (typeof data.heroImage === "string") {
        setOverrides((prev) => ({ ...prev, heroImage: data.heroImage }));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <PreviewCtx.Provider value={overrides}>{children}</PreviewCtx.Provider>;
}
