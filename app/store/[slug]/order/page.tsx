"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("cancelled") ? "Checkout was cancelled. Your phone is still reserved while you decide." : "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { slug } = await params;
      const productRes = await fetch(`/api/products/${slug}`);
      const productData = await productRes.json();
      if (!productRes.ok) throw new Error(productData.error || "Product not found.");
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: productData.product._id, customerName: form.name, customerEmail: form.email, shippingAddress: form.address }) });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return <section className="section order-page"><div className="container"><div className="section__header"><div className="section__eyebrow">Secure order</div><h1 className="section__title">Complete your order</h1><p className="section__lead">Enter your details, then pay securely on Stripe.</p></div><form className="form-card order-form" onSubmit={submit}>{error && <div className="alert alert--error">{error}</div>}<div className="field"><label htmlFor="order-name">Full name</label><input id="order-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label htmlFor="order-email">Email</label><input id="order-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="field"><label htmlFor="order-address">Delivery or collection address</label><textarea id="order-address" rows={4} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Or write: Collect from Kilburn store" /></div><button className="btn btn--primary" disabled={loading}>{loading ? "Opening secure checkout..." : "Continue to Stripe"}</button></form></div></section>;
}