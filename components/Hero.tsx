import type { ThemeHero } from "@/lib/theme";

const FALLBACK_STATS = [
  { value: "12,000+", label: "Devices repaired" },
  { value: "24hr", label: "Avg. turnaround" },
  { value: "90-day", label: "Warranty" },
];

const DEFAULT_HERO: ThemeHero = {
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
  stats: FALLBACK_STATS,
};

export default function Hero({ content }: { content?: ThemeHero }) {
  const c: ThemeHero = { ...DEFAULT_HERO, ...(content ?? {}) };
  const stats = c.stats.length ? c.stats : FALLBACK_STATS;

  return (
    <section className="hero">
      <div className="hero__grid container">
        <div className="hero__content">
          {c.badge && <span className="hero__badge">{c.badge}</span>}
          <h1 className="hero__title">
            {c.title} <span>{c.titleHighlight}</span>
          </h1>
          <p className="hero__subtitle">{c.subtitle}</p>
          <div className="hero__actions">
            <a href={c.primaryHref} className="btn btn--primary">
              {c.primaryLabel}
            </a>
            <a href={c.secondaryHref} className="btn btn--ghost">
              {c.secondaryLabel}
            </a>
          </div>
          <div className="hero__stats">
            {stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <div className="stat__value">{stat.value}</div>
                <div className="stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero__visual" aria-label="Featured device visual">
          <div
            className={`hero__image${c.imageUrl ? " hero__image--photo" : ""}`}
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" />
            ) : null}
          </div>
          <div className="hero__visual-note">
            <span className="hero__visual-check">✓</span>
            <span><strong>Repair with care</strong><small>Same-day options available</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}
