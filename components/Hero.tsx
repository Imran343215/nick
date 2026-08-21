const stats = [
  { value: "12,000+", label: "Devices repaired" },
  { value: "24hr", label: "Avg. turnaround" },
  { value: "90-day", label: "Warranty" },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <span className="hero__badge">🛠️ Trusted mobile repair experts</span>
        <h1 className="hero__title">
          Expert <span>smartphone repair</span> done right
        </h1>
        <p className="hero__subtitle">
          Cracked screens, dead batteries, water damage or slow software — we fix it
          all with free diagnostics, upfront pricing and a 90-day warranty on every
          single repair.
        </p>
        <div className="hero__actions">
          <a href="#quote" className="btn btn--primary">
            Get a Free Quote
          </a>
          <a href="#services" className="btn btn--ghost">
            Browse Services
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
    </section>
  );
}