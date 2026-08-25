const footerLinks = [
  { href: "/repair", label: "Book a Repair" },
  { href: "#services", label: "Services" },
  { href: "#track", label: "Track Repair" },
  { href: "#contact", label: "Contact" },
];

export default function Footer({
  brandName = "iTECHNICK LTD",
  text = "All rights reserved",
}: {
  brandName?: string;
  text?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {year} {brandName} · {text}</span>
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
