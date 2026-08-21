"use client";

import { useState } from "react";

const links = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#quote", label: "Get a Quote" },
  { href: "#track", label: "Track Repair" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="container nav">
        <div className="nav__brand">
          <span className="nav__brand-icon">🔧</span>
          PhoneFix Pro
        </div>

        <ul className={`nav__links${open ? " nav__links--open" : ""}`}>
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="nav__link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#quote" className="btn btn--accent nav__cta">
              Book a Repair
            </a>
          </li>
        </ul>

        <button
          className="nav__toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}