const footerLinks = [
  { href: "/repair", label: "Book a Repair" },
  { href: "#services", label: "Services" },
  { href: "#track", label: "Track Repair" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {year} iTECHNICK LTD · All rights reserved</span>
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