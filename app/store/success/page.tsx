import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type SearchParams = Promise<{ order_number?: string }>;

export default async function StoreSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { order_number: orderNumber } = await searchParams;
  return <><Header /><main><section className="section order-state"><div className="container"><div className="order-state__mark">✓</div><h1 className="section__title">Payment received</h1><p className="section__lead">Thank you for your order. Your order number is <strong className="tracking-id">{orderNumber || "shown in your confirmation email"}</strong>. Keep it to view or cancel your order.</p><div className="hero__actions"><Link href="/orders" className="btn btn--primary">View my order</Link><Link href="/" className="btn btn--ghost">Back to iTECHNICK</Link></div></div></section></main><Footer /></>;
}