import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreCancelPage() {
  return <><Header /><main><section className="section order-state"><div className="container"><div className="order-state__mark order-state__mark--cancel">!</div><h1 className="section__title">Checkout cancelled</h1><p className="section__lead">No payment was taken. You can return to the store whenever you are ready.</p><Link href="/store" className="btn btn--primary">Return to store</Link></div></section></main><Footer /></>;
}