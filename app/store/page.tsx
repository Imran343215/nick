import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreGrid from "@/components/StoreGrid";
import { fetchProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const products = await fetchProducts();
  return <><Header /><main><section className="section store-page"><div className="container"><div className="section__header"><div className="section__eyebrow">Shop iTECHNICK</div><h1 className="section__title">Reliable phones, ready for you</h1><p className="section__lead">Every item is checked by our technicians before it reaches the store.</p></div>{products.length ? <StoreGrid products={products} /> : <div className="empty-note">No products are available right now.</div>}</div></section></main><Footer /></>;
}