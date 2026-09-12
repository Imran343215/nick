import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellBrandGrid from "@/components/SellBrandGrid";
import { fetchActiveBrands } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const brands = await fetchActiveBrands();

  return (
    <>
      <Header />
      <main>
        <section className="section repair-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">Sell your phone</div>
              <h1 className="section__title">Get an instant quote for your device</h1>
              <p className="section__lead">
                Pick your brand and model, answer a few quick questions about its condition, and get
                paid — doorstep pickup included.
              </p>
            </div>

            {brands.length > 0 ? (
              <SellBrandGrid brands={brands} />
            ) : (
              <div className="empty-note">No brands are available right now. Please check back soon.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
