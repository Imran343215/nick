import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairBrandGrid from "@/components/RepairBrandGrid";
import RepairCategoryGrid from "@/components/RepairCategoryGrid";
import { fetchActiveBrands, fetchActiveCategories } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function RepairPage() {
  const categories = await fetchActiveCategories();
  const brands = await fetchActiveBrands();

  // Brands not assigned to any (active) category — kept visible so nothing
  // disappears from the catalog when categories are introduced.
  const categoryIds = new Set(categories.map((c) => c._id));
  const otherBrands = brands.filter(
    (brand) => !brand.category || !categoryIds.has(brand.category)
  );

  const uncategorised = categories.length === 0;

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">Book a repair</div>
              <h1 className="section__title">What do you need repaired?</h1>
              <p className="section__lead">
                Pick a repair type to see the brands we cover, then choose your model for transparent pricing.
              </p>
            </div>

            {uncategorised ? (
              brands.length > 0 ? (
                <RepairBrandGrid brands={brands} />
              ) : (
                <div className="empty-note">
                  No repair categories or brands are available right now. Please check back soon.
                </div>
              )
            ) : (
              <>
                <RepairCategoryGrid categories={categories} />

                {otherBrands.length > 0 && (
                  <>
                    <div className="section__header repair-section-subhead">
                      <h2 className="section__title" style={{ fontSize: "1.5rem" }}>
                        Other devices we fix
                      </h2>
                      <p className="form__note">
                        These brands are not sorted into a category yet.
                      </p>
                    </div>
                    <RepairBrandGrid brands={otherBrands} />
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
