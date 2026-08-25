import { connectDB } from "@/lib/db";
import SiteTheme from "@/models/SiteTheme";
import { clean } from "@/lib/utils";
import { blendHex } from "@/lib/color";

/* ============================================================
   Site theme — types, defaults, loader, sanitizer & CSS builder.
   The admin Theme Customizer (/admin/theme) edits a single
   "SiteTheme" document; the landing page renders it live.
   ============================================================ */

export type SectionKey =
  | "hero"
  | "services"
  | "store"
  | "howItWorks"
  | "trackRepair"
  | "testimonials"
  | "contact";

export type HeaderKey = Exclude<SectionKey, "hero">;

export interface SectionHeader {
  eyebrow: string;
  title: string;
  lead: string;
}

export interface ThemeColors {
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

export interface ThemeGradient {
  /** Start color (hex). The deeper/saturated end works best. */
  from: string;
  /** End color (hex). */
  to: string;
  /** Direction in degrees (0 = up, 90 = →, 110 = the classic diagonal). */
  angle: number;
}

export interface ThemeHeroStat {
  value: string;
  label: string;
}

export interface ThemeHero {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  imageUrl: string;
  stats: ThemeHeroStat[];
}

export interface ThemeContactCard {
  icon: string;
  title: string;
  value: string;
  href: string;
}

export interface ThemeTestimonial {
  name: string;
  meta: string;
  stars: number;
  quote: string;
}

export interface SiteThemeConfig {
  brandName: string;
  brandInitials: string;
  brandTagline: string;
  logoUrl: string;
  colors: ThemeColors;
  fonts: { body: string; display: string };
  gradient: ThemeGradient;
  radius: number;
  sections: { enabled: Record<SectionKey, boolean>; order: SectionKey[] };
  hero: ThemeHero;
  headers: Record<HeaderKey, SectionHeader>;
  contactCards: ThemeContactCard[];
  testimonials: ThemeTestimonial[];
  footerText: string;
}

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "services",
  "store",
  "howItWorks",
  "trackRepair",
  "testimonials",
  "contact",
];

/** Matches the values currently hardcoded in globals.css :root. */
export const DEFAULT_THEME: SiteThemeConfig = {
  brandName: "iTECHNICK LTD",
  brandInitials: "iT",
  brandTagline: "Mobile repair specialists",
  logoUrl: "",
  colors: {
    bg: "#060a13",
    bgSoft: "#0b1020",
    card: "#0f1527",
    cardHover: "#131a30",
    border: "rgba(148,163,184,0.14)",
    text: "#e6edf7",
    muted: "#94a3b8",
    accent: "#ffd166",
    accentStrong: "#ff9f1c",
    cta: "#ff786b",
    ctaStrong: "#ffb347",
  },
  fonts: { body: "DM Sans", display: "Space Grotesk" },
  gradient: { from: "#ff9f1c", to: "#ffd166", angle: 110 },
  radius: 14,
  sections: {
    enabled: {
      hero: true,
      services: true,
      store: true,
      howItWorks: true,
      trackRepair: true,
      testimonials: true,
      contact: true,
    },
    order: [...DEFAULT_SECTION_ORDER],
  },
  hero: {
    badge: "● Kilburn's trusted repair desk",
    title: "Your device deserves a",
    titleHighlight: "second life.",
    subtitle:
      "Expert phone, laptop and gadget repair at 140 Kilburn High Road. Clear quotes, skilled hands and a 90-day warranty on every repair.",
    primaryLabel: "Book a Repair ↗",
    primaryHref: "/repair",
    secondaryLabel: "Explore services",
    secondaryHref: "#services",
    imageUrl: "",
    stats: [
      { value: "12,000+", label: "Devices repaired" },
      { value: "24hr", label: "Avg. turnaround" },
      { value: "90-day", label: "Warranty" },
    ],
  },
  headers: {
    services: {
      eyebrow: "What we fix",
      title: "Repair Services",
      lead: "Loaded live from our database. Transparent starting prices — no hidden fees, ever.",
    },
    store: {
      eyebrow: "iTECHNICK store",
      title: "Phones worth taking home",
      lead: "Quality new and second-hand phones, checked by our repair team and ready for their next chapter.",
    },
    howItWorks: {
      eyebrow: "Simple process",
      title: "How It Works",
      lead: "From cracked screen to working device in four easy steps.",
    },
    trackRepair: {
      eyebrow: "Track your repair",
      title: "Check Repair Status",
      lead: "Enter the tracking ID from your booking confirmation to see the current status of your repair.",
    },
    testimonials: {
      eyebrow: "Reviews",
      title: "Customers Love Our Repairs",
      lead: "Real reviews from people who fixed their phones with us.",
    },
    contact: {
      eyebrow: "Get in touch",
      title: "Visit Our Store",
      lead: "Walk-ins welcome. Free diagnostics while you wait — or send a query online and we'll have it ready before you arrive.",
    },
  },
  contactCards: [
    { icon: "phone", title: "Call us", value: "+44 7424 906280", href: "tel:+447424906280" },
    { icon: "mail", title: "Email", value: "itechnickltd@gmail.com", href: "mailto:itechnickltd@gmail.com" },
    { icon: "location", title: "Visit the store", value: "140 Kilburn High Road, NW6 4JD, London, UK", href: "https://www.google.com/maps/search/?api=1&query=140+Kilburn+High+Road+NW6+4JD+London" },
    { icon: "clock", title: "Opening hours", value: "Mon–Sat · 9am – 7pm", href: "#" },
  ],
  testimonials: [
    {
      name: "Maya Chen",
      meta: "Screen repair · iPhone 13",
      stars: 5,
      quote: "Cracked screen replaced in 5 hours and it looks factory new. The 90-day warranty gave me complete peace of mind.",
    },
    {
      name: "Diego Ramirez",
      meta: "Battery replacement · Samsung S23",
      stars: 5,
      quote: "They quoted a fixed price upfront and the battery lasted a full day again. Resolved my query via the website in minutes.",
    },
    {
      name: "Priya Patel",
      meta: "Water damage · Pixel 8",
      stars: 5,
      quote: "I thought my phone was gone after a pool accident. They revived it and kept me updated with tracking the whole way.",
    },
  ],
  footerText: "All rights reserved",
};

/* ---------------- sanitization helpers ---------------- */

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

function colorString(value: unknown, fallback: string): string {
  const raw = clean(value as string);
  if (!raw) return fallback;
  if (HEX_RE.test(raw)) {
    // normalise #abc -> #aabbcc
    const hex = raw.slice(1);
    const full =
      hex.length === 3
        ? hex.split("").map((ch) => ch + ch).join("")
        : hex.toLowerCase();
    return `#${full}`;
  }
  // allow rgba()/rgb() strings for translucent tokens like --border
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(raw)) {
    return raw.replace(/\s+/g, "");
  }
  return fallback;
}

function str(value: unknown, fallback: string, max = 400): string {
  const raw = clean(value as string);
  return raw ? raw.slice(0, max) : fallback;
}

function safeHref(value: unknown, fallback: string): string {
  const raw = clean(value as string).slice(0, 500);
  if (!raw) return fallback;
  // Only allow safe URL shapes: anchors, root-relative, http(s), mailto:, tel:
  if (/^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  return fallback;
}

function fontName(value: unknown, fallback: string): string {
  const raw = clean(value as string).slice(0, 40);
  return /^[A-Za-z0-9 _'-]+$/.test(raw) ? raw : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function isSectionKey(v: unknown): v is SectionKey {
  return typeof v === "string" && DEFAULT_SECTION_ORDER.includes(v as SectionKey);
}

/**
 * Merges an arbitrary (possibly partial / legacy) DB document into the
 * default config so newly added fields always exist.
 */
export function sanitizeTheme(input: unknown): SiteThemeConfig {
  const raw = (input ?? {}) as Record<string, unknown>;
  const d = DEFAULT_THEME;

  const rawColors = (raw.colors ?? {}) as Record<string, unknown>;
  const colors = {} as ThemeColors;
  (Object.keys(d.colors) as (keyof ThemeColors)[]).forEach((key) => {
    colors[key] = colorString(rawColors[key], d.colors[key]);
  });

  const rawFonts = (raw.fonts ?? {}) as Record<string, unknown>;
  const fonts = {
    body: fontName(rawFonts.body, d.fonts.body),
    display: fontName(rawFonts.display, d.fonts.display),
  };

  const rawGradient = (raw.gradient ?? {}) as Record<string, unknown>;
  const gradient = {
    from: colorString(rawGradient.from, d.gradient.from),
    to: colorString(rawGradient.to, d.gradient.to),
    angle: clampInt(rawGradient.angle, 0, 360, d.gradient.angle),
  };

  const rawSections = (raw.sections ?? {}) as Record<string, unknown>;
  const rawEnabled = (rawSections.enabled ?? {}) as Record<string, unknown>;
  const enabled = {} as Record<SectionKey, boolean>;
  DEFAULT_SECTION_ORDER.forEach((key) => {
    enabled[key] = rawEnabled[key] !== false && rawEnabled[key] !== "false";
  });
  const rawOrder = Array.isArray(rawSections.order) ? rawSections.order : [];
  const order = rawOrder.filter(isSectionKey);
  DEFAULT_SECTION_ORDER.forEach((key) => {
    if (!order.includes(key)) order.push(key); // keep list complete
  });

  const rawHero = (raw.hero ?? {}) as Record<string, unknown>;
  const heroStats = Array.isArray(rawHero.stats)
    ? (rawHero.stats as Record<string, unknown>[])
        .slice(0, 6)
        .map((s) => ({
          value: str(s?.value, "", 40),
          label: str(s?.label, "", 60),
        }))
        .filter((s) => s.value || s.label)
    : [];
  const hero: ThemeHero = {
    badge: str(rawHero.badge, d.hero.badge, 120),
    title: str(rawHero.title, d.hero.title, 160),
    titleHighlight: str(rawHero.titleHighlight, d.hero.titleHighlight, 160),
    subtitle: str(rawHero.subtitle, d.hero.subtitle, 600),
    primaryLabel: str(rawHero.primaryLabel, d.hero.primaryLabel, 60),
    primaryHref: safeHref(rawHero.primaryHref, d.hero.primaryHref),
    secondaryLabel: str(rawHero.secondaryLabel, d.hero.secondaryLabel, 60),
    secondaryHref: safeHref(rawHero.secondaryHref, d.hero.secondaryHref),
    imageUrl: str(rawHero.imageUrl, "", 600),
    stats: heroStats.length ? heroStats : d.hero.stats.map((s) => ({ ...s })),
  };

  const headers = {} as Record<HeaderKey, SectionHeader>;
  (Object.keys(d.headers) as HeaderKey[]).forEach((key) => {
    const h = ((raw.headers ?? {}) as Record<string, unknown>)[key] as
      | Record<string, unknown>
      | undefined;
    headers[key] = {
      eyebrow: str(h?.eyebrow, d.headers[key].eyebrow, 80),
      title: str(h?.title, d.headers[key].title, 120),
      lead: str(h?.lead, d.headers[key].lead, 300),
    };
  });

  const rawCards = Array.isArray(raw.contactCards)
    ? (raw.contactCards as Record<string, unknown>[]).slice(0, 8)
    : [];
  const contactCards: ThemeContactCard[] = rawCards.length
    ? rawCards
        .map((c) => ({
          icon: /^[a-z]+$/.test(String(c?.icon)) ? String(c.icon).slice(0, 20) : "wrench",
          title: str(c?.title, "", 60),
          value: str(c?.value, "", 200),
          href: safeHref(c?.href, "#"),
        }))
        .filter((c) => c.value)
    : d.contactCards.map((c) => ({ ...c }));

  const rawTestimonials = Array.isArray(raw.testimonials)
    ? (raw.testimonials as Record<string, unknown>[]).slice(0, 12)
    : [];
  const testimonials: ThemeTestimonial[] = rawTestimonials.length
    ? rawTestimonials
        .map((t) => ({
          name: str(t?.name, "", 60),
          meta: str(t?.meta, "", 100),
          stars: clampInt(t?.stars, 1, 5, 5),
          quote: str(t?.quote, "", 500),
        }))
        .filter((t) => t.quote)
    : d.testimonials.map((t) => ({ ...t }));

  const initialsRaw = clean(raw.brandInitials as string).slice(0, 3);

  return {
    brandName: str(raw.brandName, d.brandName, 80) || d.brandName,
    brandInitials: initialsRaw || d.brandInitials,
    brandTagline: str(raw.brandTagline, d.brandTagline, 120),
    logoUrl: str(raw.logoUrl, "", 600),
    colors,
    fonts,
    gradient,
    radius: clampInt(raw.radius, 0, 32, d.radius),
    sections: { enabled, order: order as SectionKey[] },
    hero,
    headers,
    contactCards,
    testimonials,
    footerText: str(raw.footerText, d.footerText, 120),
  };
}

/* ---------------- data access ---------------- */

/**
 * Loads the active theme from MongoDB.
 * Falls back to DEFAULT_THEME when nothing is saved yet or the DB is
 * unavailable, so pages always render.
 */
export async function fetchTheme(): Promise<SiteThemeConfig> {
  try {
    await connectDB();
    const doc = await SiteTheme.findById("site").lean().exec();
    if (!doc) return DEFAULT_THEME;
    return sanitizeTheme(doc);
  } catch (err) {
    console.error("[theme] could not load site theme:", err);
    return DEFAULT_THEME;
  }
}

/** Saves a full theme payload (already validated by the API route). */
export async function saveTheme(config: SiteThemeConfig): Promise<SiteThemeConfig> {
  await connectDB();
  await SiteTheme.findByIdAndUpdate(
    "site",
    { $set: { ...config } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  return config;
}

/** Removes the stored theme so the site falls back to defaults. */
export async function resetTheme(): Promise<SiteThemeConfig> {
  await connectDB();
  await SiteTheme.findByIdAndDelete("site").exec();
  return DEFAULT_THEME;
}

/* ---------------- CSS generation ---------------- */

function hexToRgba(hex: string, alpha: number): string | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Builds the <style> contents injected by the root layout.
 * Overrides the CSS custom properties that globals.css is built on,
 * plus the body glow / header tint derived from them, so the entire
 * site re-themes without touching any stylesheet.
 */
export function buildThemeCss(theme: SiteThemeConfig): string {
  const c = theme.colors;
  const bodyFont = `"${theme.fonts.body}", "Segoe UI", system-ui, sans-serif`;
  const displayFont = `"${theme.fonts.display}", "${theme.fonts.body}", sans-serif`;
  const googleHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    theme.fonts.body.replace(/ /g, "+")
  )}:wght@400;500;600;700&family=${encodeURIComponent(
    theme.fonts.display.replace(/ /g, "+")
  )}:wght@500;600;700&display=swap`;

  const headerTint = hexToRgba(c.bg, 0.82);
  const glowA = hexToRgba(c.accentStrong, 0.12);
  const glowB = hexToRgba(c.accent, 0.05);

  const gFrom = /^#[0-9a-fA-F]{6}$/.test(theme.gradient.from);
  const gTo = /^#[0-9a-fA-F]{6}$/.test(theme.gradient.to);
  const gradientCss =
    gFrom && gTo
      ? `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.from} 0%, ${blendHex(
          theme.gradient.from,
          theme.gradient.to,
          0.5
        )} 52%, ${theme.gradient.to} 100%)`
      : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.from}, ${theme.gradient.to})`;

  return `
@import url("${googleHref}");
:root{
  --bg:${c.bg};
  --bg-soft:${c.bgSoft};
  --card:${c.card};
  --card-hover:${c.cardHover};
  --border:${c.border};
  --text:${c.text};
  --muted:${c.muted};
  --accent:${c.accent};
  --accent-strong:${c.accentStrong};
  --cta:${c.cta};
  --cta-strong:${c.ctaStrong};
${glowA ? `  --glow-a:${glowA};\n` : ""}${glowB ? `  --glow-b:${glowB};\n` : ""}${
    headerTint ? `  --header-bg:${headerTint};\n` : ""
  }  --grad-from:${theme.gradient.from};
  --grad-to:${theme.gradient.to};
  --grad-angle:${theme.gradient.angle};
  --gradient:${gradientCss};
  --radius:${theme.radius}px;
  --font:${bodyFont};
  --display:${displayFont};
}
`.trim();
}









