"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Repair bookings", exact: true },
  { href: "/admin/theme", label: "Theme customizer" },
  { href: "/admin/repair-services", label: "Repair services" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/products", label: "Store products" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminShell({
  title,
  eyebrow,
  lead,
  children,
}: {
  title: string;
  eyebrow?: string;
  lead?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="admin admin--shell">
      <div className="container admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <span className="nav__brand-icon" aria-hidden="true">
              iT
            </span>
            <div>
              <strong>Admin</strong>
              <small>iTECHNICK back office</small>
            </div>
          </div>
          <nav className="admin-sidebar__nav" aria-label="Admin navigation">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-sidebar__link${active ? " admin-sidebar__link--active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="admin-sidebar__footer">
            <Link href="/" className="btn btn--ghost admin-sidebar__btn">
              View site
            </Link>
            <Link href="/repair" className="btn btn--ghost admin-sidebar__btn">
              Repair catalog
            </Link>
            <button type="button" className="btn btn--ghost admin-sidebar__btn" onClick={logout}>
              Log out
            </button>
          </div>
        </aside>

        <div className="admin-shell__main">
          <div className="section__header">
            {eyebrow && <div className="section__eyebrow">{eyebrow}</div>}
            <h1 className="section__title">{title}</h1>
            {lead && <p className="section__lead">{lead}</p>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
