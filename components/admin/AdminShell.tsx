"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: string; exact?: boolean }[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Dashboard", icon: "▦", exact: true },
      { href: "/admin/orders", label: "Orders", icon: "🧾" },
    ],
  },
  {
    label: "Inventory & Sales",
    items: [
      { href: "/admin/products", label: "Products", icon: "📦" },
      { href: "/admin/coupons", label: "Coupons", icon: "🎟" },
    ],
  },
  {
    label: "Repair",
    items: [
      { href: "/admin/repair-services", label: "Repair catalog", icon: "🔧" },
    ],
  },
  {
    label: "Sell phone",
    items: [
      { href: "/admin/sell-orders", label: "Sell orders", icon: "📱" },
      { href: "/admin/sell-variants", label: "Sell variants", icon: "⚙" },
      { href: "/admin/sell-questions", label: "Sell questions", icon: "❓" },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/banner", label: "Banner / Carousel", icon: "🖼" },
      { href: "/admin/theme", label: "Theme", icon: "🎨" },
    ],
  },
];

export default function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  /** Right-aligned button(s) shown next to the page title, e.g. a "+ New" button. */
  actions?: ReactNode;
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
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="admin-sidebar__group-label">{group.label}</div>
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`admin-sidebar__link${active ? " admin-sidebar__link--active" : ""}`}
                    >
                      <span className="admin-sidebar__icon" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <Link href="/" className="btn btn--ghost admin-sidebar__btn">
              View site
            </Link>
            <button type="button" className="btn btn--ghost admin-sidebar__btn" onClick={logout}>
              Log out
            </button>
          </div>
        </aside>

        <div className="admin-shell__main">
          <div className="admin-header">
            <h1>{title}</h1>
            {actions && <div className="admin-header__actions">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
