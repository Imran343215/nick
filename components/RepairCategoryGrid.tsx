import Link from "next/link";
import type { CategoryShape } from "@/lib/repair-catalog";

export default function RepairCategoryGrid({
  categories,
}: {
  categories: CategoryShape[];
}) {
  return (
    <div className="repair-grid">
      {categories.map((category) => (
        <Link
          key={category._id}
          href={`/repair/category/${category.slug}`}
          className="repair-card repair-card--brand"
        >
          <div className="repair-card__media">
            <img src={category.icon} alt={category.name} />
          </div>
          <h3>{category.name}</h3>
        </Link>
      ))}
    </div>
  );
}