import { type ServiceShape } from "@/lib/services";
import { formatPrice } from "@/lib/utils";

export default function Services({
  services,
}: {
  services: ServiceShape[];
}) {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">What we fix</div>
          <h2 className="section__title">Repair Services</h2>
          <p className="section__lead">
            Loaded live from our database. Transparent starting prices — no hidden
            fees, ever.
          </p>
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
                <div className="service-card__icon">{service.icon}</div>
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