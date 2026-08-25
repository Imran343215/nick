import BrandIcon, { type IconName } from "@/components/BrandIcon";
import type { SectionHeader, ThemeContactCard } from "@/lib/theme";

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "Get in touch",
  title: "Visit Our Store",
  lead: "Walk-ins welcome. Free diagnostics while you wait — or send a query online and we'll have it ready before you arrive.",
};

const FALLBACK_CARDS: ThemeContactCard[] = [
  { icon: "phone", title: "Call us", value: "+44 7424 906280", href: "tel:+447424906280" },
  { icon: "mail", title: "Email", value: "itechnickltd@gmail.com", href: "mailto:itechnickltd@gmail.com" },
  { icon: "location", title: "Visit the store", value: "140 Kilburn High Road, NW6 4JD, London, UK", href: "https://www.google.com/maps/search/?api=1&query=140+Kilburn+High+Road+NW6+4JD+London" },
  { icon: "clock", title: "Opening hours", value: "Mon–Sat · 9am – 7pm", href: "#" },
];

function safeIcon(icon: string): IconName {
  return icon in BRAND_ICON_NAMES ? (icon as IconName) : "wrench";
}

// Re-exported marker list so safeIcon can validate without importing internals.
const BRAND_ICON_NAMES = {
  phone: true, mail: true, location: true, clock: true, note: true,
  chat: true, wrench: true, package: true, screen: true, battery: true,
  water: true, port: true, camera: true, settings: true, laptop: true,
  tablet: true,
};

export default function Contact({
  header,
  cards,
}: {
  header?: SectionHeader;
  cards?: ThemeContactCard[];
}) {
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };
  const contacts = cards && cards.length ? cards : FALLBACK_CARDS;

  return (
    <section className="section section--tint" id="contact">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>
        <div className="contact-grid">
          {contacts.map((c, i) => (
            <div className="contact-card" key={`${c.title}-${i}`}>
              <div className="contact-card__icon"><BrandIcon name={safeIcon(c.icon)} /></div>
              <div className="contact-card__title">{c.title}</div>
              <div className="contact-card__value">
                <a href={c.href}>{c.value}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
