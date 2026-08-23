"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

type Order = {
  orderNumber: string;
  productName: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

export default function OrderLookup() {
  const { isLoaded, isSignedIn } = useUser();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically load the signed-in user's orders — no manual search needed.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    setError("");
    setLoading(true);

    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load your orders.");
        if (!cancelled) setAllOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load your orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // The order number box is now an optional local filter over the user's orders.
  const q = query.trim().toLowerCase();
  const orders = q
    ? allOrders.filter((o) => o.orderNumber.toLowerCase().includes(q))
    : allOrders;

  async function cancelOrder(orderNumber: string) {
    if (!window.confirm("Cancel this order and request a Stripe refund?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel order.");
      setAllOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderNumber && data.order
            ? { ...o, ...data.order }
            : o
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel order.");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <section className="section order-lookup">
        <div className="container">
          <div className="empty-note">Checking your account...</div>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return (
      <section className="section order-lookup">
        <div className="container">
          <div className="form-card auth-card">
            <div className="section__eyebrow">Customer orders</div>
            <h1 className="section__title">Sign in to view orders</h1>
            <p className="section__lead">
              Your orders are linked securely to your Clerk account.
            </p>
            <div className="auth-providers">
              <SignInButton mode="modal">
                <button className="btn btn--primary auth-provider">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn--ghost auth-provider">Create account</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section order-lookup">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Customer orders</div>
          <h1 className="section__title">Your orders</h1>
          <p className="section__lead">
            These are the orders linked to your account. Use the filter below to
            narrow by order number if you have many.
          </p>
        </div>

        <form
          className="form-card order-form"
          onSubmit={(e) => e.preventDefault()}
        >
          {error && <div className="alert alert--error">{error}</div>}
          <div className="field">
            <label htmlFor="lookup-number">Filter by order number (optional)</label>
            <input
              id="lookup-number"
              placeholder="e.g. IT-ABC123"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" disabled={loading}>
            {loading ? "Loading..." : "Filter orders"}
          </button>
        </form>

        {loading && <div className="empty-note">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="empty-note">
            {q ? "No orders match that order number." : "You don't have any orders yet."}
          </div>
        )}

        {orders.map((order) => (
          <div className="order-result" key={order.orderNumber}>
            <strong>{order.productName}</strong>
            <span>{order.orderNumber}</span>
            <span>{formatPrice(order.total)}</span>
            <span className="status-badge">
              Payment: {order.paymentStatus} · {order.fulfillmentStatus}
            </span>
            {["pending", "processing"].includes(order.fulfillmentStatus) && (
              <button
                className="btn btn--ghost"
                onClick={() => cancelOrder(order.orderNumber)}
                disabled={loading}
              >
                Cancel order and refund
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}