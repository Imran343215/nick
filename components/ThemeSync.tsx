"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { applyThemeToDocument, themeFingerprint } from "@/lib/preview-vars";

const POLL_MS = 4000;

/**
 * ThemeSync — mounted once in the root layout. Polls the active theme every
 * few seconds (and immediately when the tab regains focus). When the saved
 * theme changes, it paints the new colors/fonts instantly and asks Next.js
 * to soft-refresh server components, so content edits (hero copy/image,
 * section order…) appear without any manual reload.
 */
export default function ThemeSync({
  initialFingerprint,
}: {
  initialFingerprint: string;
}) {
  const router = useRouter();
  const lastRef = useRef(initialFingerprint);

  useEffect(() => {
    let disposed = false;

    async function tick() {
      try {
        const res = await fetch("/api/theme", { cache: "no-store" });
        if (!res.ok || disposed) return;
        const data = (await res.json()) as {
          ok?: boolean;
          theme?: Parameters<typeof themeFingerprint>[0];
        };
        if (!data?.ok || !data.theme) return;

        const fp = themeFingerprint(data.theme);
        if (fp === lastRef.current) return;
        lastRef.current = fp;

        // Instant visual paint…
        applyThemeToDocument(
          buildVarsSafe(data.theme),
          data.theme.fonts
        );
        // …then re-render server components so content matches too.
        router.refresh();
      } catch {
        /* offline / dev restart — ignore this tick */
      }
    }

    const onFocus = () => void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    window.addEventListener("focus", onFocus);

    return () => {
      disposed = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}

// Small indirection so the poller stays decoupled from lib internals.
import { buildThemeOverrideVars } from "@/lib/preview-vars";
function buildVarsSafe(theme: Parameters<typeof themeFingerprint>[0]) {
  return buildThemeOverrideVars(theme);
}
