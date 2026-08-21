import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreSuccessPage() {
  return <><Header /><main><section className="section order-state"><div className="container"><div className="order-state__mark">✓</div><h1 className="section__title">Payment received</h1><p className="section__lead">Thank you for your order. We will contact you with collection or delivery details.</p><Link href="/" className="btn btn--primary">Back to iTECHNICK</Link></div></section></main><Footer /></>;
}