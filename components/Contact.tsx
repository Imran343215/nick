const contacts = [
  {
    icon: "📞",
    title: "Call us",
    value: "+44 7424 906280",
    href: "tel:+447424906280",
  },
  {
    icon: "✉️",
    title: "Email",
    value: "itechnickltd@gmail.com",
    href: "mailto:itechnickltd@gmail.com",
  },
  {
    icon: "📍",
    title: "Visit the store",
    value: "140 Kilburn High Road, NW6 4JD, London, UK",
    href: "https://www.google.com/maps/search/?api=1&query=140+Kilburn+High+Road+NW6+4JD+London",
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