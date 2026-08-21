const testimonials = [
  {
    name: "Maya Chen",
    meta: "Screen repair · iPhone 13",
    stars: "★★★★★",
    quote:
      "Cracked screen replaced in 5 hours and it looks factory new. The 90-day warranty gave me complete peace of mind.",
  },
  {
    name: "Diego Ramirez",
    meta: "Battery replacement · Samsung S23",
    stars: "★★★★★",
    quote:
      "They quoted a fixed price upfront and the battery lasted a full day again. Resolved my query via the website in minutes.",
  },
  {
    name: "Priya Patel",
    meta: "Water damage · Pixel 8",
    stars: "★★★★★",
    quote:
      "I thought my phone was gone after a pool accident. They revived it and kept me updated with tracking the whole way.",
  },
];

export default function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Reviews</div>
          <h2 className="section__title">Customers Love Our Repairs</h2>
          <p className="section__lead">Real reviews from people who fixed their phones with us.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <figure className="testimonial" key={t.name}>
              <div className="testimonial__stars">{t.stars}</div>
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