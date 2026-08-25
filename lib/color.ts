/* ============================================================
   Color utilities — pure functions, zero dependencies.
   Safe to import from client components AND server code
   (no Mongoose/db imports here).
   ============================================================ */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  /** 0–360 */
  h: number;
  /** 0–100 */
  s: number;
  /** 0–100 */
  l: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

/** Parses #rgb / #rrggbb into RGB. Returns null for anything else. */
export function hexToRgb(hex: string): Rgb | null {
  const m = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(hex.trim());
  if (!m) return null;
  const raw = m[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (v: number) => clampByte(v).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Linear blend of two hex colors. t=0 → a, t=1 → b. */
export function blendHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  const k = clamp(t, 0, 1);
  return rgbToHex({
    r: ra.r + (rb.r - ra.r) * k,
    g: ra.g + (rb.g - ra.g) * k,
    b: ra.b + (rb.b - ra.b) * k,
  });
}

/** Relative luminance (WCAG), 0 (black) → 1 (white). */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const lin = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b)
  );
}

/** Circular mean of two hues so red(350)+orange(30) averages to 10, not 190. */
function meanHue(a: number, b: number): number {
  const rad = Math.PI / 180;
  const x = (Math.cos(a * rad) + Math.cos(b * rad)) / 2;
  const y = (Math.sin(a * rad) + Math.sin(b * rad)) / 2;
  const deg = Math.atan2(y, x) / rad;
  return (deg + 360) % 360;
}

export interface DerivedPalette {
  bg: string;
  bgSoft: string;
  card: string;
  cardHover: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  cta: string;
  ctaStrong: string;
}

/**
 * Builds a full, harmonized surface palette from a brand gradient.
 *
 * - Surfaces take the gradient's hue at low saturation so the whole page
 *   feels tinted by the brand without being loud.
 * - Dark gradients get a dark scheme, light gradients a light one
 *   (auto-detected from luminance unless `dark` is passed).
 * - Accent tokens map onto the gradient's own ends so buttons and
 *   highlights match the brand exactly.
 */
export function deriveThemeColorsFromGradient(
  from: string,
  to: string,
  dark?: boolean
): DerivedPalette {
  const hA = hexToHsl(from);
  const hB = hexToHsl(to);
  if (!hA || !hB) {
    return {
      bg: "", bgSoft: "", card: "", cardHover: "", border: "",
      text: "", muted: "", accent: "", accentStrong: "", cta: "", ctaStrong: "",
    };
  }

  const h = meanHue(hA.h, hB.h);
  const lumAvg = (relativeLuminance(from) + relativeLuminance(to)) / 2;
  const isDark = dark ?? lumAvg < 0.45;

  // Surfaces use a muted version of the brand saturation.
  const surfS = clamp(((hA.s + hB.s) / 2) * 0.35, 8, 30);

  // Order gradient ends by luminance: deep = the stronger/darker anchor.
  const deepEnd = relativeLuminance(from) <= relativeLuminance(to) ? from : to;
  const lightEnd = deepEnd === from ? to : from;

  // Pale ends are great on dark backgrounds but wash out on white,
  // so light schemes pull the accent toward the deeper half.
  const accent = isDark
    ? lightEnd
    : blendHex(deepEnd, lightEnd, 0.45);

  if (isDark) {
    return {
      bg: hslToHex({ h, s: surfS, l: 6 }),
      bgSoft: hslToHex({ h, s: surfS, l: 9 }),
      card: hslToHex({ h, s: surfS, l: 12 }),
      cardHover: hslToHex({ h, s: surfS, l: 15 }),
      border: hslToHex({ h, s: clamp(surfS * 1.2, 10, 36), l: 22 }),
      text: hslToHex({ h, s: clamp(surfS * 0.5, 10, 35), l: 92 }),
      muted: hslToHex({ h, s: clamp(surfS * 0.4, 8, 26), l: 66 }),
      accent,
      accentStrong: deepEnd,
      cta: blendHex(deepEnd, lightEnd, 0.35),
      ctaStrong: blendHex(deepEnd, lightEnd, 0.55),
    };
  }

  return {
    bg: hslToHex({ h, s: surfS, l: 97 }),
    bgSoft: hslToHex({ h, s: surfS, l: 94 }),
    card: "#ffffff",
    cardHover: hslToHex({ h, s: surfS * 0.6, l: 96 }),
    border: hslToHex({ h, s: clamp(surfS * 0.8, 8, 28), l: 86 }),
    text: hslToHex({ h, s: clamp(surfS * 0.6, 12, 40), l: 16 }),
    muted: hslToHex({ h, s: clamp(surfS * 0.4, 6, 24), l: 40 }),
    accent,
    accentStrong: deepEnd,
    cta: blendHex(deepEnd, lightEnd, 0.35),
    ctaStrong: blendHex(deepEnd, lightEnd, 0.55),
  };
}
