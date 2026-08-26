import Link from "next/link";
import RepairCategoryGrid from "@/components/RepairCategoryGrid";
import type { CategoryShape as RepairCategoryShape } from "@/lib/repair-catalog";
import type { CategoryShape as StoreCategoryShape } from "@/lib/categories";
import type { SectionHeader } from "@/lib/theme";

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "What we fix",
  title: "Repair Services",
  lead: "Pick a repair category to book your fix, or browse the device categories we sell.",
};

export default function Services({
  repairCategories,
  storeCategories,
  header,
}: {
  /** Active repair categories managed in admin (Repair services → Categories). */
  repairCategories: RepairCategoryShape[];
  /** Store categories managed in admin (Store products → Categories). */
  storeCategories: StoreCategoryShape[];
  header?: SectionHeader;
}) {
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>

        {/* Repair categories created in the admin */}
        {repairCategories.length > 0 ? (
          <RepairCategoryGrid categories={repairCategories} />
        ) : (
          <div className="empty-note">
            No repair categories yet — add them in the admin under Repair
            services → Categories.
          </div>
        )}

        {/* Store ("sell") categories created in the admin */}
        {storeCategories.length > 0 && (
          <div className="services-shopby">
            <h3 className="services-shopby__title">Shop by category</h3>
            <p className="form__note">
              Browse the devices we currently have for sale.
            </p>
            <div className="shopby-grid">
              {storeCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/store?category=${encodeURIComponent(category.slug)}`}
                  className="shopby-card"
                >
                  <span className="shopby-card__name">{category.name}</span>
                  <span className="shopby-card__cta">Shop now →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
