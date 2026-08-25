import type { SectionHeader, ThemeTestimonial } from "@/lib/theme";

const FALLBACK_TESTIMONIALS: ThemeTestimonial[] = [
  {
    name: "Maya Chen",
    meta: "Screen repair · iPhone 13",
    stars: 5,
    quote:
      "Cracked screen replaced in 5 hours and it looks factory new. The 90-day warranty gave me complete peace of mind.",
  },
  {
    name: "Diego Ramirez",
    meta: "Battery replacement · Samsung S23",
    stars: 5,
    quote:
      "They quoted a fixed price upfront and the battery lasted a full day again. Resolved my query via the website in minutes.",
  },
  {
    name: "Priya Patel",
    meta: "Water damage · Pixel 8",
    stars: 5,
    quote:
      "I thought my phone was gone after a pool accident. They revived it and kept me updated with tracking the whole way.",
  },
];

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "Reviews",
  title: "Customers Love Our Repairs",
  lead: "Real reviews from people who fixed their phones with us.",
};

export default function Testimonials({
  header,
  items,
}: {
  header?: SectionHeader;
  items?: ThemeTestimonial[];
}) {
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };
  const testimonials = items && items.length ? items : FALLBACK_TESTIMONIALS;

  return (
    <section className="section" id="testimonials">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <figure className="testimonial" key={`${t.name}-${i}`}>
              <div className="testimonial__stars">{"★".repeat(t.stars)}</div>
              <blockquote className="testimonial__quote">“{t.quote}”</blockquote>
              <figcaption>
                <div className="testimonial__author">{t.name}</div>
                <div className="testimonial__meta">{t.meta}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
