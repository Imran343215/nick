"use client";

import { useState } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const links = [
  { href: "/repair", label: "Repairs" },
  { href: "#services", label: "Services" },
  { href: "/store", label: "Store" },
  { href: "/orders", label: "My order" },
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
          <span className="nav__brand-icon" aria-hidden="true">iT</span>
          <span className="nav__brand-name">iTECHNICK <small>LTD</small></span>
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
          <li className="nav__auth-group">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn--primary nav__auth">Sign in</button>
              </SignInButton>
            </Show>
            <Show when="signed-in"><UserButton /></Show>
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