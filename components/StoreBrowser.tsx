"use client";

import { useMemo, useState } from "react";
import StoreGrid from "@/components/StoreGrid";
import type { ProductShape } from "@/lib/products";
import type { CategoryShape } from "@/lib/categories";

export type StoreCategory = CategoryShape & { count: number };

/**
 * Category filter bar + grid for the store page. Lets visitors browse
 * products grouped by the categories the admin creates.
 */
export default function StoreBrowser({
  products,
  categories,
}: {
  products: ProductShape[];
  categories: StoreCategory[];
}) {
  const [active, setActive] = useState("all");

  // Categories that actually have products, plus an "All" chip.
  const chips = useMemo(() => {
    const withProducts = categories.filter((c) => c.count > 0);
    if (withProducts.length === 0) return [];
    return withProducts;
  }, [categories]);

  const visible = useMemo(
    () =>
      active === "all"
        ? products
        : products.filter((p) => p.category === active),
    [products, active]
  );

  return (
    <div className="store-browser">
      {chips.length > 0 && (
        <div className="store-filter" role="tablist" aria-label="Filter products by category">
          <button
            type="button"
            role="tab"
            aria-selected={active === "all"}
            className={`store-filter__chip${active === "all" ? " store-filter__chip--active" : ""}`}
            onClick={() => setActive("all")}
          >
            All <span className="store-filter__count">{products.length}</span>
          </button>
          {chips.map((cat) => (
            <button
              type="button"
              role="tab"
              aria-selected={active === cat.name}
              key={cat._id}
              className={`store-filter__chip${active === cat.name ? " store-filter__chip--active" : ""}`}
              onClick={() => setActive(cat.name)}
            >
              {cat.name} <span className="store-filter__count">{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <StoreGrid products={visible} />
      ) : (
        <div className="empty-note">No products are available in this category right now.</div>
      )}
    </div>
  );
}