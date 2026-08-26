"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ProductCategoriesManager from "./ProductCategoriesManager";
import ProductManager from "./ProductManager";

type Tab = "categories" | "products";

const TABS: [Tab, string][] = [
  ["categories", "Categories"],
  ["products", "Products"],
];

function normalizeTab(value?: string): Tab {
  const match = TABS.find(([key]) => key === value);
  return match ? match[0] : "products";
}

export default function ProductsAdmin({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>(() => normalizeTab(initialTab));

  return (
    <AdminShell
      eyebrow="Store management"
      title="Store products"
      lead="List new and second-hand devices with secure Stripe checkout — manage store categories and products."
    >
      <div className="products-admin">
        <div className="admin-tabs" role="tablist" aria-label="Store products sections">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`admin-tab${tab === key ? " admin-tab--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "categories" && <ProductCategoriesManager />}
        {tab === "products" && <ProductManager />}
      </div>
    </AdminShell>
  );
}
