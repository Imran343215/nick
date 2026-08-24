import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { serializeProduct } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const found = await Product.findOne({ slug, active: true }).lean().exec();
  if (!found) notFound();
  const product = serializeProduct(found);
  return <><Header /><main><section className="section product-page"><div className="container product-detail"><img src={product.imageUrl} alt={product.name} className="product-detail__image" /><div className="product-detail__content"><span className="section__eyebrow">{product.category ? `${product.category} · ` : ""}{product.condition === "new" ? "New device" : "Second-hand, checked by iTECHNICK"}</span><h1 className="section__title">{product.name}</h1><p className="product-detail__description">{product.description}</p><div className="product-detail__price">{formatPrice(product.price)}</div><p className="form__note">{product.stock > 0 ? `${product.stock} available` : "Currently sold out"} · Secure payment with Stripe</p>{product.stock > 0 ? <Link href={`/store/${product.slug}/order`} className="btn btn--primary">Buy</Link> : <span className="btn btn--ghost">Sold out</span>}</div></div></section></main><Footer /></>;
}