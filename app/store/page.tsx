import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreBrowser, { type StoreCategory } from "@/components/StoreBrowser";
import { fetchProducts } from "@/lib/products";
import { fetchCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
  ]);

  // Count active products per category so the filter chips show real numbers.
  const counts = new Map<string, number>();
  for (const product of products) {
    if (product.category) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
  }
  const storeCategories: StoreCategory[] = categories.map((cat) => ({
    ...cat,
    count: counts.get(cat.name) ?? 0,
  }));

  return (
    <>
      <Header />
      <main>
        <section className="section store-page">
          <div className="container">
            <div className="section__header">
              <div className="section__eyebrow">Shop iTECHNICK</div>
              <h1 className="section__title">Reliable phones, ready for you</h1>
              <p className="section__lead">
                Every item is checked by our technicians before it reaches the
                store. Search, filter and sort to find the phone you're after.
              </p>
            </div>
            {products.length ? (
              <StoreBrowser products={products} categories={storeCategories} />
            ) : (
              <div className="empty-note">
                No products are available right now.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}