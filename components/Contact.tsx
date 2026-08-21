const contacts = [
  {
    icon: "📞",
    title: "Call us",
    value: "+1 (555) 010-2030",
    href: "tel:+15550102030",
  },
  {
    icon: "✉️",
    title: "Email",
    value: "hello@phonefixpro.example",
    href: "mailto:hello@phonefixpro.example",
  },
  {
    icon: "📍",
    title: "Visit the store",
    value: "128 Main Street, Unit 4, Springfield",
    href: "#",
  },
  {
    icon: "🕘",
    title: "Opening hours",
    value: "Mon–Sat · 9am – 7pm",
    href: "#",
  },
];

export default function Contact() {
  return (
    <section className="section section--tint" id="contact">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Get in touch</div>
          <h2 className="section__title">Visit Our Store</h2>
          <p className="section__lead">
            Walk-ins welcome. Free diagnostics while you wait — or send a query
            online and we’ll have it ready before you arrive.
          </p>
        </div>
        <div className="contact-grid">
          {contacts.map((c) => (
            <div className="contact-card" key={c.title}>
              <div className="contact-card__icon">{c.icon}</div>
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