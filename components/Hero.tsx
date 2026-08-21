const stats = [
  { value: "12,000+", label: "Devices repaired" },
  { value: "24hr", label: "Avg. turnaround" },
  { value: "90-day", label: "Warranty" },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__grid container">
        <div className="hero__content">
          <span className="hero__badge">● Kilburn's trusted repair desk</span>
          <h1 className="hero__title">
            Your device deserves a <span>second life.</span>
          </h1>
          <p className="hero__subtitle">
            Expert phone, laptop and gadget repair at 140 Kilburn High Road. Clear
            quotes, skilled hands and a 90-day warranty on every repair.
          </p>
          <div className="hero__actions">
            <a href="#quote" className="btn btn--primary">
              Get a Free Quote <span aria-hidden="true">↗</span>
            </a>
            <a href="#services" className="btn btn--ghost">
              Explore services
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
        <div className="hero__visual" aria-label="iPhone 17 in sage green, featured image from Gizmodo">
          <div className="hero__image" />
          <div className="hero__visual-note">
            <span className="hero__visual-check">✓</span>
            <span><strong>Repair with care</strong><small>Same-day options available</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}