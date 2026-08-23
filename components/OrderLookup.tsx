"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

type Order = { orderNumber: string; productName: string; total: number; paymentStatus: string; fulfillmentStatus: string; createdAt: string };

export default function OrderLookup() {
  const { isLoaded, isSignedIn } = useUser();
  const [form, setForm] = useState({ orderNumber: "" });
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(form.orderNumber)}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Order not found."); else setOrder(data.order);
    setLoading(false);
  }

  async function cancelOrder() {
    if (!window.confirm("Cancel this order and request a Stripe refund?")) return;
    setLoading(true); setError("");
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not cancel order."); else setOrder(data.order);
    setLoading(false);
  }

  if (!isLoaded) return <section className="section order-lookup"><div className="container"><div className="empty-note">Checking your account...</div></div></section>;
  if (!isSignedIn) return <section className="section order-lookup"><div className="container"><div className="form-card auth-card"><div className="section__eyebrow">Customer orders</div><h1 className="section__title">Sign in to view orders</h1><p className="section__lead">Your orders are linked securely to your Clerk account.</p><div className="auth-providers"><SignInButton mode="modal"><button className="btn btn--primary auth-provider">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="btn btn--ghost auth-provider">Create account</button></SignUpButton></div></div></div></section>;
  return <section className="section order-lookup"><div className="container"><div className="section__header"><div className="section__eyebrow">Customer orders</div><h1 className="section__title">Find your order</h1><p className="section__lead">Use the order number from your payment confirmation. Your signed-in Clerk account verifies ownership.</p></div><form className="form-card order-form" onSubmit={lookup}>{error && <div className="alert alert--error">{error}</div>}<div className="field"><label htmlFor="lookup-number">Order number</label><input id="lookup-number" required placeholder="IT-ABC123" value={form.orderNumber} onChange={(e) => setForm({ orderNumber: e.target.value })} /></div><button className="btn btn--primary" disabled={loading}>{loading ? "Checking..." : "View order"}</button></form>{order && <div className="order-result"><strong>{order.productName}</strong><span>{order.orderNumber}</span><span>{formatPrice(order.total)}</span><span className="status-badge">Payment: {order.paymentStatus} · {order.fulfillmentStatus}</span>{["pending", "processing"].includes(order.fulfillmentStatus) && <button className="btn btn--ghost" onClick={cancelOrder} disabled={loading}>Cancel order and refund</button>}</div>}</div></section>;
}