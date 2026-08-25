"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useToast } from "@/components/ui/toast";
import { uploadCatalogImage } from "@/lib/upload";
import { blendHex, deriveThemeColorsFromGradient, hexToRgb } from "@/lib/color";
import type {
  SectionHeader,
  SectionKey,
  SiteThemeConfig,
  ThemeColors,
  ThemeGradient,
} from "@/lib/theme";

/* Local copies (client-safe): never import values from lib/theme here,
   because that module pulls in Mongoose on the server. */

type Tab = "brand" | "colors" | "fonts" | "sections" | "hero" | "content";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "hero", label: "Hero banner" },
  { key: "services", label: "Repair services" },
  { key: "store", label: "Store products" },
  { key: "howItWorks", label: "How It Works" },
  { key: "trackRepair", label: "Track repair" },
  { key: "testimonials", label: "Testimonials" },
  { key: "contact", label: "Contact" },
];

const SECTION_LABELS: Record<SectionKey, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s.label])
) as Record<SectionKey, string>;

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "bg", label: "Page background" },
  { key: "bgSoft", label: "Soft background" },
  { key: "card", label: "Card background" },
  { key: "cardHover", label: "Card hover" },
  { key: "border", label: "Borders" },
  { key: "text", label: "Body text" },
  { key: "muted", label: "Muted text" },
  { key: "accent", label: "Accent" },
  { key: "accentStrong", label: "Accent strong" },
  { key: "cta", label: "CTA color" },
  { key: "ctaStrong", label: "CTA strong" },
];

function rgbaFromHex(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : null;
}

/**
 * Mirrors buildThemeCss() from lib/theme.ts but runs client-side on the
 * UNSAVED form state, so the preview iframe can be tinted instantly.
 */
function buildPreviewVars(t: SiteThemeConfig): Record<string, string> {
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

interface GradientTemplate {
  name: string;
  from: string;
  to: string;
  angle: number;
  dark?: boolean;
}

/** One-click brand gradients — the palette is auto-derived on click. */
const GRADIENT_TEMPLATES: GradientTemplate[] = [
  // Dark schemes
  { name: "Neon Cyber", from: "#06b6d4", to: "#d946ef", angle: 120 },
  { name: "Golden Luxury", from: "#b45309", to: "#fde68a", angle: 110 },
  { name: "Coffee House", from: "#92400e", to: "#fbbf24", angle: 110 },
  { name: "Deep Space", from: "#4f46e5", to: "#a78bfa", angle: 130 },
  { name: "Teal Lagoon", from: "#0d9488", to: "#5eead4", angle: 110 },
  { name: "Ember Night", from: "#dc2626", to: "#fb923c", angle: 110 },
  // Light schemes
  { name: "Arctic Frost", from: "#0284c7", to: "#7dd3fc", angle: 110, dark: false },
  { name: "Rose Quartz", from: "#e11d48", to: "#fda4af", angle: 110, dark: false },
  { name: "Mint Fresh", from: "#059669", to: "#6ee7b7", angle: 110, dark: false },
  { name: "Lavender Mist", from: "#7c3aed", to: "#c4b5fd", angle: 110, dark: false },
  { name: "Slate Pro", from: "#334155", to: "#94a3b8", angle: 110, dark: false },
  { name: "Sunny Day", from: "#ea580c", to: "#fde047", angle: 115, dark: false },
];

const FONT_OPTIONS = [
  "DM Sans",
  "Inter",
  "Poppins",
  "Montserrat",
  "Space Grotesk",
  "Sora",
  "Manrope",
  "Raleway",
  "Rubik",
  "Playfair Display",
  "Oswald",
  "Merriweather",
];

const PRESETS: { name: string; colors: ThemeColors; gradient: ThemeGradient }[] = [
  {
    name: "Midnight Amber",
    colors: { bg: "#060a13", bgSoft: "#0b1020", card: "#0f1527", cardHover: "#131a30", border: "rgba(148,163,184,0.14)", text: "#e6edf7", muted: "#94a3b8", accent: "#ffd166", accentStrong: "#ff9f1c", cta: "#ff786b", ctaStrong: "#ffb347" },
    gradient: { from: "#ff9f1c", to: "#ffd166", angle: 110 },
  },
  {
    name: "Ocean Blue",
    colors: { bg: "#06121f", bgSoft: "#0a1a2b", card: "#0e2136", cardHover: "#132a44", border: "rgba(125,170,220,0.15)", text: "#e3eef9", muted: "#8fa9c2", accent: "#67d4ff", accentStrong: "#1e90ff", cta: "#2fa3e8", ctaStrong: "#66c7ff" },
    gradient: { from: "#1e90ff", to: "#67d4ff", angle: 110 },
  },
  {
    name: "Royal Purple",
    colors: { bg: "#0d0a1c", bgSoft: "#141031", card: "#1a1440", cardHover: "#211a52", border: "rgba(180,150,255,0.16)", text: "#ece7fb", muted: "#a79ccd", accent: "#d7b3ff", accentStrong: "#8b5cf6", cta: "#a78bfa", ctaStrong: "#c4a5ff" },
    gradient: { from: "#8b5cf6", to: "#d7b3ff", angle: 110 },
  },
  {
    name: "Forest Green",
    colors: { bg: "#081410", bgSoft: "#0c1d17", card: "#10261e", cardHover: "#153227", border: "rgba(130,200,160,0.15)", text: "#e4f3ea", muted: "#93b8a4", accent: "#8ff0b4", accentStrong: "#22c55e", cta: "#34d399", ctaStrong: "#86efac" },
    gradient: { from: "#22c55e", to: "#8ff0b4", angle: 110 },
  },
  {
    name: "Crimson Night",
    colors: { bg: "#140a0e", bgSoft: "#1e1016", card: "#26141c", cardHover: "#301a24", border: "rgba(230,150,170,0.15)", text: "#fbe9ee", muted: "#c39aa7", accent: "#ffb3c1", accentStrong: "#f43f5e", cta: "#fb7185", ctaStrong: "#ffa2b0" },
    gradient: { from: "#f43f5e", to: "#ffb3c1", angle: 110 },
  },
  {
    name: "Clean Light",
    colors: { bg: "#f5f6fb", bgSoft: "#eef0f8", card: "#ffffff", cardHover: "#f3f4fb", border: "rgba(30,41,59,0.12)", text: "#16213a", muted: "#5b6880", accent: "#f59e0b", accentStrong: "#d97706", cta: "#ea7a4b", ctaStrong: "#f5a05a" },
    gradient: { from: "#d97706", to: "#f59e0b", angle: 110 },
  },
];

const ICON_OPTIONS = [
  "phone", "mail", "location", "clock", "note", "chat", "wrench",
  "package", "screen", "battery", "water", "port", "camera",
  "settings", "laptop", "tablet",
];

const HEADER_KEYS: { key: Exclude<SectionKey, "hero">; label: string }[] = [
  { key: "services", label: "Repair services" },
  { key: "store", label: "Store products" },
  { key: "howItWorks", label: "How It Works" },
  { key: "trackRepair", label: "Track repair" },
  { key: "testimonials", label: "Testimonials" },
  { key: "contact", label: "Contact" },
];

const EMPTY_FORM: SiteThemeConfig = {
  brandName: "iTECHNICK LTD",
  brandInitials: "iT",
  brandTagline: "Mobile repair specialists",
  logoUrl: "",
  colors: { ...PRESETS[0].colors },
  fonts: { body: "DM Sans", display: "Space Grotesk" },
  gradient: { from: "#ff9f1c", to: "#ffd166", angle: 110 },
  radius: 14,
  sections: {
    enabled: { hero: true, services: true, store: true, howItWorks: true, trackRepair: true, testimonials: true, contact: true },
    order: ["hero", "services", "store", "howItWorks", "trackRepair", "testimonials", "contact"],
  },
  hero: {
    badge: "● Kilburn's trusted repair desk",
    title: "Your device deserves a",
    titleHighlight: "second life.",
    subtitle: "",
    primaryLabel: "Book a Repair ↗",
    primaryHref: "/repair",
    secondaryLabel: "Explore services",
    secondaryHref: "#services",
    imageUrl: "",
    stats: [{ value: "", label: "" }],
  },
  headers: Object.fromEntries(
    HEADER_KEYS.map((h) => [h.key, { eyebrow: "", title: "", lead: "" }])
  ) as Record<Exclude<SectionKey, "hero">, SectionHeader>,
  contactCards: [],
  testimonials: [],
  footerText: "All rights reserved",
};
export default function ThemeManager() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<SiteThemeConfig>(EMPTY_FORM);
  const [savedJson, setSavedJson] = useState("");
  const [tab, setTab] = useState<Tab>("brand");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  // Increments when the preview iframe (re)loads or admin hits ⟳ — each
  // increment re-pushes the current unsaved theme into the iframe.
  const [previewNonce, setPreviewNonce] = useState(0);

  const dirty = useMemo(
    () => JSON.stringify(form) !== savedJson,
    [form, savedJson]
  );

  // Live preview: stream the UNSAVED theme into the iframe on every change.
  useEffect(() => {
    if (!previewNonce || !previewRef.current?.contentWindow) return;
    previewRef.current.contentWindow.postMessage(
      {
        type: "theme-preview",
        cssVars: buildPreviewVars(form),
        fonts: { body: form.fonts.body, display: form.fonts.display },
        heroImage: form.hero.imageUrl,
      },
      window.location.origin
    );
  }, [form, previewNonce]);

  useEffect(() => {
    fetch("/api/admin/theme")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.ok && data.theme) {
          setForm(data.theme);
          setSavedJson(JSON.stringify(data.theme));
        }
      })
      .catch(() => toast.error("Could not load the current theme."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(next: Partial<SiteThemeConfig>) {
    setForm((f) => ({ ...f, ...next }));
  }

  function setColor(key: keyof ThemeColors, value: string) {
    setForm((f) => ({ ...f, colors: { ...f.colors, [key]: value } }));
  }

  function setGradient(next: Partial<ThemeGradient>) {
    setForm((f) => ({ ...f, gradient: { ...f.gradient, ...next } }));
  }

  /** One-click template: full palette + gradient derived together. */
  function applyTemplate(t: GradientTemplate) {
    const derived = deriveThemeColorsFromGradient(t.from, t.to, t.dark);
    patch({
      colors: { ...derived },
      gradient: { from: t.from, to: t.to, angle: t.angle },
    });
  }

  /** Keep current gradient, re-derive every other color to match it. */
  function autoMatchGradient() {
    const derived = deriveThemeColorsFromGradient(
      form.gradient.from,
      form.gradient.to
    );
    patch({ colors: { ...form.colors, ...derived } });
  }

  function setHeader(key: Exclude<SectionKey, "hero">, next: Partial<SectionHeader>) {
    setForm((f) => ({
      ...f,
      headers: { ...f.headers, [key]: { ...f.headers[key], ...next } },
    }));
  }

  function moveSection(index: number, dir: -1 | 1) {
    const order = [...form.sections.order];
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    patch({ sections: { ...form.sections, order } });
  }

  async function handleUpload(file: File, target: "logo" | "hero") {
    const setter = target === "logo" ? setUploadingLogo : setUploadingHero;
    setter(true);
    try {
      const uploaded = await uploadCatalogImage(file);
      patch(target === "logo" ? { logoUrl: uploaded.url } : { hero: { ...form.hero, imageUrl: uploaded.url } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setter(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not save the theme.");
      setSavedJson(JSON.stringify(data.theme));
      toast.success("Theme saved — live on the site now.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the theme.");
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefaults() {
    if (!window.confirm("Reset the landing page theme to the built-in defaults?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/theme/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not reset the theme.");
      setForm(data.theme);
      setSavedJson(JSON.stringify(data.theme));
      toast.success("Theme restored to defaults.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the theme.");
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return (
      <AdminShell eyebrow="Landing page" title="Theme customizer" lead="Loading the current theme…">
        <div className="empty-note">Loading theme settings…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Landing page"
      title="Theme customizer"
      lead="Full control over the landing page theme — brand, colors, fonts, section order and all copy. Changes go live the moment you save."
    >
      <div className="theme-customizer">
        <div className="admin-toolbar admin-toolbar--compact">
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetToDefaults} disabled={saving}>
            Reset to defaults
          </button>
          <span className="form__note">
            {dirty ? "● Unsaved changes" : "All changes saved"}
          </span>
        </div>

        <div className="theme-tabs">
          {(
            [
              ["brand", "Brand"],
              ["colors", "Colors"],
              ["fonts", "Fonts & style"],
              ["sections", "Sections"],
              ["hero", "Hero"],
              ["content", "Content"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`theme-tab${tab === key ? " theme-tab--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="theme-layout">
          <div>
            {tab === "brand" && (
              <form className="form-card admin-form-card">
                <div className="form-grid">
                  <div className="field">
                    <label>Brand name</label>
                    <input value={form.brandName} onChange={(e) => patch({ brandName: e.target.value })} placeholder="iTECHNICK LTD" />
                  </div>
                  <div className="field">
                    <label>Logo initials (fallback icon)</label>
                    <input maxLength={3} value={form.brandInitials} onChange={(e) => patch({ brandInitials: e.target.value })} placeholder="iT" />
                  </div>
                  <div className="field field--full">
                    <label>Tagline (used for SEO description)</label>
                    <input value={form.brandTagline} onChange={(e) => patch({ brandTagline: e.target.value })} />
                  </div>
                  <div className="field field--full">
                    <label>Logo image URL (replaces initials)</label>
                    <input value={form.logoUrl} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://…" />
                    <label className="order-delivery-option" style={{ marginTop: "0.5rem" }}>
                      <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} />
                      {uploadingLogo ? "Uploading…" : "Upload logo"}
                    </label>
                    {form.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Logo preview" className="catalog-admin-thumb" style={{ marginTop: "0.5rem" }} />
                    )}
                  </div>
                </div>
              </form>
            )}
            {tab === "colors" && (
              <form className="form-card admin-form-card">
                <div className="field field--full">
                  <label>Quick palettes</label>
                  <div className="preset-row">
                    {PRESETS.map((preset) => (
                      <button key={preset.name} type="button" className="preset-chip" onClick={() => patch({ colors: { ...preset.colors }, gradient: { ...preset.gradient } })}>
                        <span className="preset-swatch" style={{ background: `linear-gradient(135deg, ${preset.colors.accentStrong}, ${preset.colors.bg})` }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field field--full">
                  <label>Brand gradient</label>
                  <div
                    className="gradient-bar"
                    style={{
                      background: `linear-gradient(${form.gradient.angle}deg, ${form.gradient.from}, ${form.gradient.to})`,
                    }}
                  />
                  <div className="list-row__grid" style={{ marginTop: "0.6rem" }}>
                    <div className="color-field">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(form.gradient.from) ? form.gradient.from : "#000000"}
                        onChange={(e) => setGradient({ from: e.target.value })}
                        aria-label="Gradient start"
                      />
                      <div className="color-field__meta">
                        <span className="color-field__label">From</span>
                        <input type="text" value={form.gradient.from} onChange={(e) => setGradient({ from: e.target.value })} spellCheck={false} />
                      </div>
                    </div>
                    <div className="color-field">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(form.gradient.to) ? form.gradient.to : "#000000"}
                        onChange={(e) => setGradient({ to: e.target.value })}
                        aria-label="Gradient end"
                      />
                      <div className="color-field__meta">
                        <span className="color-field__label">To</span>
                        <input type="text" value={form.gradient.to} onChange={(e) => setGradient({ to: e.target.value })} spellCheck={false} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: "0.3rem", alignContent: "center", minWidth: 170 }}>
                      <span className="color-field__label">Angle — {form.gradient.angle}°</span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={form.gradient.angle}
                        onChange={(e) => setGradient({ angle: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <button type="button" className="btn btn--accent" style={{ marginTop: "0.7rem", padding: "0.5rem 1rem" }} onClick={autoMatchGradient}>
                    ✨ Auto-match colors to gradient
                  </button>
                  <p className="form__note" style={{ marginTop: "0.35rem" }}>
                    Re-derives background, cards, borders and text from your gradient's hue.
                  </p>

                  <label style={{ display: "block", marginTop: "1rem" }}>Quick gradient templates</label>
                  <div className="preset-row" style={{ marginTop: "0.45rem" }}>
                    {GRADIENT_TEMPLATES.map((t) => (
                      <button key={t.name} type="button" className="preset-chip" onClick={() => applyTemplate(t)}>
                        <span className="preset-swatch" style={{ background: `linear-gradient(${t.angle}deg, ${t.from}, ${t.to})` }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <p className="form__note" style={{ marginTop: "0.4rem" }}>
                    Each template applies a full matching palette automatically — dark for dark gradients, light for light ones.
                  </p>
                </div>
                <div className="color-grid">
                  {COLOR_FIELDS.map(({ key, label }) => {
                    const value = form.colors[key];
                    const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
                    return (
                      <div className="color-field" key={key}>
                        <input type="color" value={pickerValue} onChange={(e) => setColor(key, e.target.value)} aria-label={label} />
                        <div className="color-field__meta">
                          <span className="color-field__label">{label}</span>
                          <input type="text" value={value} onChange={(e) => setColor(key, e.target.value)} spellCheck={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </form>
            )}

            {tab === "fonts" && (
              <form className="form-card admin-form-card">
                <div className="form-grid">
                  <div className="field">
                    <label>Body font (Google Font)</label>
                    <select value={form.fonts.body} onChange={(e) => patch({ fonts: { ...form.fonts, body: e.target.value } })}>
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Display font (headings)</label>
                    <select value={form.fonts.display} onChange={(e) => patch({ fonts: { ...form.fonts, display: e.target.value } })}>
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="field field--full">
                    <label>Corner radius — {form.radius}px</label>
                    <input type="range" min={0} max={32} value={form.radius} onChange={(e) => patch({ radius: Number(e.target.value) })} style={{ width: "100%" }} />
                  </div>
                </div>
              </form>
            )}

            {tab === "sections" && (
              <div className="form-card admin-form-card">
                <p className="form__note" style={{ marginBottom: "0.75rem" }}>
                  Tick sections to show them on the landing page and use ↑ / ↓ to change their order.
                </p>
                <div className="section-order">
                  {form.sections.order.map((key, index) => (
                    <div className="section-order__item" key={key}>
                      <input
                        type="checkbox"
                        checked={form.sections.enabled[key]}
                        onChange={(e) =>
                          patch({
                            sections: {
                              ...form.sections,
                              enabled: { ...form.sections.enabled, [key]: e.target.checked },
                            },
                          })
                        }
                        aria-label={`Show ${SECTION_LABELS[key]}`}
                      />
                      <span className="section-order__label">{SECTION_LABELS[key]}</span>
                      <button type="button" className="icon-btn" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                      <button type="button" className="icon-btn" onClick={() => moveSection(index, 1)} disabled={index === form.sections.order.length - 1} aria-label="Move down">↓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "hero" && (
              <form className="form-card admin-form-card">
                <div className="form-grid">
                  <div className="field field--full">
                    <label>Badge</label>
                    <input value={form.hero.badge} onChange={(e) => patch({ hero: { ...form.hero, badge: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Title (first part)</label>
                    <input value={form.hero.title} onChange={(e) => patch({ hero: { ...form.hero, title: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Title highlight (gradient text)</label>
                    <input value={form.hero.titleHighlight} onChange={(e) => patch({ hero: { ...form.hero, titleHighlight: e.target.value } })} />
                  </div>
                  <div className="field field--full">
                    <label>Subtitle</label>
                    <textarea rows={3} value={form.hero.subtitle} onChange={(e) => patch({ hero: { ...form.hero, subtitle: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Primary button label</label>
                    <input value={form.hero.primaryLabel} onChange={(e) => patch({ hero: { ...form.hero, primaryLabel: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Primary button link</label>
                    <input value={form.hero.primaryHref} onChange={(e) => patch({ hero: { ...form.hero, primaryHref: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Secondary button label</label>
                    <input value={form.hero.secondaryLabel} onChange={(e) => patch({ hero: { ...form.hero, secondaryLabel: e.target.value } })} />
                  </div>
                  <div className="field">
                    <label>Secondary button link</label>
                    <input value={form.hero.secondaryHref} onChange={(e) => patch({ hero: { ...form.hero, secondaryHref: e.target.value } })} />
                  </div>
                  <div className="field field--full">
                    <label>Hero image URL (optional — replaces the CSS artwork)</label>
                    <input value={form.hero.imageUrl} onChange={(e) => patch({ hero: { ...form.hero, imageUrl: e.target.value } })} placeholder="https://…" />
                    <label className="order-delivery-option" style={{ marginTop: "0.5rem" }}>
                      <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "hero")} />
                      {uploadingHero ? "Uploading…" : "Upload hero image"}
                    </label>
                    {form.hero.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.hero.imageUrl} alt="Hero image preview" className="catalog-admin-thumb" style={{ marginTop: "0.5rem" }} />
                    )}
                  </div>
                </div>

                <div className="list-editor" style={{ marginTop: "1rem" }}>
                  <div className="list-row__head">
                    <span>Stats row</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() =>
                        patch({
                          hero: {
                            ...form.hero,
                            stats: [...form.hero.stats, { value: "", label: "" }],
                          },
                        })
                      }
                      aria-label="Add stat"
                    >
                      +
                    </button>
                  </div>
                  {form.hero.stats.map((stat, index) => (
                    <div className="list-row__grid" key={index}>
                      <input placeholder="Value (e.g. 12,000+)" value={stat.value} onChange={(e) => {
                        const stats = [...form.hero.stats];
                        stats[index] = { ...stats[index], value: e.target.value };
                        patch({ hero: { ...form.hero, stats } });
                      }} />
                      <input placeholder="Label (e.g. Devices repaired)" value={stat.label} onChange={(e) => {
                        const stats = [...form.hero.stats];
                        stats[index] = { ...stats[index], label: e.target.value };
                        patch({ hero: { ...form.hero, stats } });
                      }} />
                      <button type="button" className="icon-btn" onClick={() => patch({ hero: { ...form.hero, stats: form.hero.stats.filter((_, i) => i !== index) } })} aria-label="Remove stat">✕</button>
                    </div>
                  ))}
                </div>
              </form>
            )}
            {tab === "content" && (
              <>
                {HEADER_KEYS.map(({ key, label }) => (
                  <div className="form-card admin-form-card" key={key} style={{ marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>{label} heading</h2>
                    <div className="form-grid">
                      <div className="field">
                        <label>Eyebrow</label>
                        <input value={form.headers[key].eyebrow} onChange={(e) => setHeader(key, { eyebrow: e.target.value })} />
                      </div>
                      <div className="field">
                        <label>Title</label>
                        <input value={form.headers[key].title} onChange={(e) => setHeader(key, { title: e.target.value })} />
                      </div>
                      <div className="field field--full">
                        <label>Lead text</label>
                        <textarea rows={2} value={form.headers[key].lead} onChange={(e) => setHeader(key, { lead: e.target.value })} />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="form-card admin-form-card" style={{ marginBottom: "1rem" }}>
                  <div className="list-row__head" style={{ marginBottom: "0.5rem" }}>
                    <span>Contact cards</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() =>
                        patch({
                          contactCards: [
                            ...form.contactCards,
                            { icon: "wrench", title: "", value: "", href: "#" },
                          ],
                        })
                      }
                      aria-label="Add contact card"
                    >
                      +
                    </button>
                  </div>
                  <div className="list-editor">
                    {form.contactCards.map((card, index) => (
                      <div className="list-row" key={index}>
                        <div className="list-row__grid">
                          <select value={card.icon} onChange={(e) => {
                            const cards = [...form.contactCards];
                            cards[index] = { ...cards[index], icon: e.target.value };
                            patch({ contactCards: cards });
                          }} aria-label="Icon">
                            {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                          </select>
                          <input placeholder="Title (e.g. Call us)" value={card.title} onChange={(e) => {
                            const cards = [...form.contactCards];
                            cards[index] = { ...cards[index], title: e.target.value };
                            patch({ contactCards: cards });
                          }} />
                          <input placeholder="Value (shown to visitors)" value={card.value} onChange={(e) => {
                            const cards = [...form.contactCards];
                            cards[index] = { ...cards[index], value: e.target.value };
                            patch({ contactCards: cards });
                          }} />
                          <input placeholder="Link (tel:/mailto:/https:/#)" value={card.href} onChange={(e) => {
                            const cards = [...form.contactCards];
                            cards[index] = { ...cards[index], href: e.target.value };
                            patch({ contactCards: cards });
                          }} />
                          <button type="button" className="icon-btn" onClick={() => patch({ contactCards: form.contactCards.filter((_, i) => i !== index) })} aria-label="Remove card">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-card admin-form-card" style={{ marginBottom: "1rem" }}>
                  <div className="list-row__head" style={{ marginBottom: "0.5rem" }}>
                    <span>Testimonials</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() =>
                        patch({
                          testimonials: [
                            ...form.testimonials,
                            { name: "", meta: "", stars: 5, quote: "" },
                          ],
                        })
                      }
                      aria-label="Add testimonial"
                    >
                      +
                    </button>
                  </div>
                  <div className="list-editor">
                    {form.testimonials.map((t, index) => (
                      <div className="list-row" key={index}>
                        <div className="list-row__grid">
                          <input placeholder="Customer name" value={t.name} onChange={(e) => {
                            const items = [...form.testimonials];
                            items[index] = { ...items[index], name: e.target.value };
                            patch({ testimonials: items });
                          }} />
                          <input placeholder="Meta (e.g. Screen repair · iPhone 13)" value={t.meta} onChange={(e) => {
                            const items = [...form.testimonials];
                            items[index] = { ...items[index], meta: e.target.value };
                            patch({ testimonials: items });
                          }} />
                          <select value={t.stars} onChange={(e) => {
                            const items = [...form.testimonials];
                            items[index] = { ...items[index], stars: Number(e.target.value) };
                            patch({ testimonials: items });
                          }} aria-label="Stars">
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                          </select>
                        </div>
                        <textarea rows={2} placeholder="Review quote" value={t.quote} onChange={(e) => {
                          const items = [...form.testimonials];
                          items[index] = { ...items[index], quote: e.target.value };
                          patch({ testimonials: items });
                        }} />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="button" className="icon-btn" onClick={() => patch({ testimonials: form.testimonials.filter((_, i) => i !== index) })} aria-label="Remove testimonial">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-card admin-form-card">
                  <div className="field field--full">
                    <label>Footer text (after the © year and brand)</label>
                    <input value={form.footerText} onChange={(e) => patch({ footerText: e.target.value })} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="theme-preview-col">
            <div className="theme-preview">
              <div className="theme-preview__bar">
                <span>Live landing page preview</span>
                <button type="button" className="icon-btn" onClick={() => setPreviewNonce((n) => n + 1)} aria-label="Reload preview">⟳</button>
              </div>
              <iframe
                ref={previewRef}
                src="/"
                title="Landing page preview"
                loading="lazy"
                onLoad={() => setPreviewNonce((n) => n + 1)}
              />
            </div>
            <p className="form__note" style={{ marginTop: "0.5rem" }}>
              Edits appear here instantly — even before saving. Press ⟳ to see the last-saved version.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}






