/**
 * Client-safe helpers shared by the admin live preview and the site-wide
 * ThemeSync poller. Pure functions only — no Mongoose/db imports here, so
 * this file is safe to include in client bundles. The DOM-touching helper
 * at the bottom is only ever CALLED from client components.
 */
import { blendHex, hexToRgb } from "@/lib/color";
import type { SiteThemeConfig } from "@/lib/theme";

function rgbaFromHex(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : null;
}

/** Mirrors buildThemeCss(): the full override map for one theme config. */
export function buildThemeOverrideVars(
  t: SiteThemeConfig
): Record<string, string> {
  const c = t.colors;
  const vars: Record<string, string> = {
    "--bg": c.bg,
    "--bg-soft": c.bgSoft,
    "--card": c.card,
    "--card-hover": c.cardHover,
    "--border": c.border,
    "--text": c.text,
    "--muted": c.muted,
    "--accent": c.accent,
    "--accent-strong": c.accentStrong,
    "--cta": c.cta,
    "--cta-strong": c.ctaStrong,
    "--radius": `${t.radius}px`,
    "--font": `"${t.fonts.body}", "Segoe UI", system-ui, sans-serif`,
    "--display": `"${t.fonts.display}", "${t.fonts.body}", sans-serif`,
    "--grad-from": t.gradient.from,
    "--grad-to": t.gradient.to,
    "--grad-angle": String(t.gradient.angle),
  };

  const glowA = rgbaFromHex(c.accentStrong, 0.12);
  if (glowA) vars["--glow-a"] = glowA;
  const glowB = rgbaFromHex(c.accent, 0.05);
  if (glowB) vars["--glow-b"] = glowB;
  const headerBg = rgbaFromHex(c.bg, 0.82);
  if (headerBg) vars["--header-bg"] = headerBg;

  const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
  vars["--gradient"] =
    isHex(t.gradient.from) && isHex(t.gradient.to)
      ? `linear-gradient(${t.gradient.angle}deg, ${t.gradient.from} 0%, ${blendHex(
          t.gradient.from,
          t.gradient.to,
          0.5
        )} 52%, ${t.gradient.to} 100%)`
      : `linear-gradient(${t.gradient.angle}deg, ${t.gradient.from}, ${t.gradient.to})`;

  return vars;
}

/** Tiny stable fingerprint (djb2 + length) for change detection. */
export function themeFingerprint(t: SiteThemeConfig): string {
  const json = JSON.stringify(t);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h * 33) ^ json.charCodeAt(i)) >>> 0;
  }
  return `${h.toString(16)}-${json.length}`;
}

/** Applies override variables (+ optional Google Fonts) to the document. */
export function applyThemeToDocument(
  vars: Record<string, string>,
  fonts?: { body: string; display: string }
): void {
  const style = document.documentElement.style;
  Object.entries(vars).forEach(([name, value]) => {
    style.setProperty(name, value);
  });

  if (fonts?.body && fonts?.display) {
    const fam = (name: string) => encodeURIComponent(name).replace(/%20/g, "+");
    const href = `https://fonts.googleapis.com/css2?family=${fam(
      fonts.body
    )}:wght@400;500;600;700&family=${fam(fonts.display)}:wght@500;600;700&display=swap`;
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
}
