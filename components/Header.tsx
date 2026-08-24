"use client";

import { useState } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const links = [
  { href: "#services", label: "Services" },
  { href: "/store", label: "Store" },
  { href: "#how-it-works", label: "How It Works" },
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
          <Show when="signed-in">
            <li>
              <Link href="/orders" className="nav__link" onClick={() => setOpen(false)}>
                My order
              </Link>
            </li>
          </Show>
          <li>
            <Link href="/repair" className="btn btn--accent nav__cta" onClick={() => setOpen(false)}>
              Book a Repair
            </Link>
          </li>
          <li className="nav__auth-group">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn--primary nav__auth">Sign in</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My orders"
                    href="/orders"
                    labelIcon={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                    }
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
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