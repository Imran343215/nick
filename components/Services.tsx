import { type ServiceShape } from "@/lib/services";
import { formatPrice } from "@/lib/utils";
import BrandIcon, { type IconName } from "@/components/BrandIcon";
import type { SectionHeader } from "@/lib/theme";

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "What we fix",
  title: "Repair Services",
  lead: "Loaded live from our database. Transparent starting prices — no hidden fees, ever.",
};

function serviceIcon(icon: string, category: string): IconName {
  const icons: Record<string, IconName> = {
    "🖥️": "screen",
    "🔋": "battery",
    "💧": "water",
    "🔌": "port",
    "📷": "camera",
    "⚙️": "settings",
  };
  return icons[icon] ?? (category.toLowerCase().includes("software") ? "settings" : "wrench");
}

export default function Services({
  services,
  header,
}: {
  services: ServiceShape[];
  header?: SectionHeader;
}) {
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>

        {services.length === 0 ? (
          <div className="empty-note">
            Services are not loaded yet. Connect MongoDB and run{" "}
            <code>npm run seed</code> to populate the service catalog.
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service._id}>
                <div className="service-card__icon">
                  <BrandIcon name={serviceIcon(service.icon, service.category)} />
                </div>
                <h3 className="service-card__name">{service.name}</h3>
                <span className="service-card__cat">{service.category}</span>
                <p className="service-card__desc">{service.description}</p>
                <div className="service-card__meta">
                  <span>from {formatPrice(service.priceFrom)}</span>
                  <span>{service.turnaroundDays} day turnaround</span>
                </div>
                {service.featured && (
                  <span className="service-card__badge">Popular</span>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
