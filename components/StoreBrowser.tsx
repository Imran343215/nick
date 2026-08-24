"use client";

import { useMemo, useState } from "react";
import StoreGrid from "@/components/StoreGrid";
import type { ProductShape } from "@/lib/products";
import type { CategoryShape } from "@/lib/categories";

export type StoreCategory = CategoryShape & { count: number };

type Condition = "all" | "new" | "second-hand";
type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

/**
 * Search box, category + condition filters and sort for the store page.
 * Combines with the product grid so visitors can find the phone they want.
 */
export default function StoreBrowser({
  products,
  categories,
}: {
  products: ProductShape[];
  categories: StoreCategory[];
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<Condition>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  // Categories that actually have products, plus an "All" chip.
  const chips = useMemo(() => {
    const withProducts = categories.filter((c) => c.count > 0);
    if (withProducts.length === 0) return [];
    return withProducts;
  }, [categories]);

  const visible = useMemo(() => {
    let list = products;

    if (active !== "all") {
      list = list.filter((p) => (p.category ?? "") === active);
    }

    if (condition !== "all") {
      list = list.filter((p) => p.condition === condition);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.description, p.category ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list = [...list].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;
      default:
        // Featured first, then newest (matches the DB order).
        list = [...list].sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
        );
    }

    return list;
  }, [products, active, condition, query, sort]);

  return (
    <div className="store-browser">
      <div className="store-toolbar">
        <input
          type="search"
          className="store-search"
          placeholder="Search phones, brands, categories…"
          aria-label="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="store-sort"
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="store-filter" role="group" aria-label="Filter by condition">
        {(
          [
            { value: "all", label: "All conditions" },
            { value: "new", label: "New" },
            { value: "second-hand", label: "Second-hand" },
          ] as { value: Condition; label: string }[]
        ).map((opt) => (
          <button
            type="button"
            role="tab"
            aria-selected={condition === opt.value}
            key={opt.value}
            className={`store-filter__chip${condition === opt.value ? " store-filter__chip--active" : ""}`}
            onClick={() => setCondition(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {chips.length > 0 && (
        <div className="store-filter" role="group" aria-label="Filter by category">
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
        <div className="empty-note">
          No products match your search. Try a different keyword or filter.
        </div>
      )}
    </div>
  );
}