import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RepairBrandGrid from "@/components/RepairBrandGrid";
import { fetchActiveBrands } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function RepairPage() {
  const brands = await fetchActiveBrands();

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">Book a repair</div>
              <h1 className="section__title">Choose your brand</h1>
              <p className="section__lead">
                Select your phone brand to browse models and repair options with
                transparent pricing.
              </p>
            </div>
            {brands.length > 0 ? (
              <RepairBrandGrid brands={brands} />
            ) : (
              <div className="empty-note">
                No repair brands are available right now. Please check back soon.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
