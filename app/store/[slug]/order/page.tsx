"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const [form, setForm] = useState({ address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("cancelled") ? "Checkout was cancelled. Your phone is still reserved while you decide." : "");

  if (!isLoaded) return <section className="section order-page"><div className="container"><div className="empty-note">Checking your account...</div></div></section>;

  if (!isSignedIn) return <section className="section order-page"><div className="container"><div className="form-card auth-card"><div className="section__eyebrow">Secure order</div><h1 className="section__title">Sign in to buy</h1><p className="section__lead">Create an account or sign in before continuing to checkout.</p><div className="auth-providers"><SignInButton mode="modal"><button className="btn btn--primary auth-provider">Sign in to continue</button></SignInButton><SignUpButton mode="modal"><button className="btn btn--ghost auth-provider">Create account</button></SignUpButton></div></div></div></section>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { slug } = await params;
      const productRes = await fetch(`/api/products/${slug}`);
      const productData = await productRes.json();
      if (!productRes.ok) throw new Error(productData.error || "Product not found.");
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: productData.product._id, shippingAddress: form.address }) });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return <section className="section order-page"><div className="container"><div className="section__header"><div className="section__eyebrow">Secure order</div><h1 className="section__title">Complete your order</h1><p className="section__lead">Signed in as {user?.primaryEmailAddress?.emailAddress}. Enter delivery or collection details, then pay securely on Stripe.</p></div><form className="form-card order-form" onSubmit={submit}>{error && <div className="alert alert--error">{error}</div>}<div className="field"><label htmlFor="order-address">Delivery or collection address</label><textarea id="order-address" rows={4} value={form.address} onChange={(e) => setForm({ address: e.target.value })} placeholder="Or write: Collect from Kilburn store" /></div><button className="btn btn--primary" disabled={loading}>{loading ? "Opening secure checkout..." : "Continue to Stripe"}</button></form></div></section>;
}