const footerLinks = [
  { href: "#services", label: "Services" },
  { href: "#quote", label: "Get a Quote" },
  { href: "#track", label: "Track Repair" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {year} PhoneFix Pro · All rights reserved</span>
        <ul className="footer__links">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}