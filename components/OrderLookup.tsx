"use client";

import { useEffect, useState } from "react";
import { courierTrackerUrl, formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

type Order = {
  orderNumber: string;
  productName: string;
  quantity: number;
  total: number;
  currency: string;
  customerName: string;
  shippingCarrier?: string;
  shippingNumber?: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  invoiceNumber?: string | null;
};

export default function OrderLookup() {
  const { isLoaded, isSignedIn } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState("");
  const toast = useToast();

  // Automatically load the signed-in user's orders — no search required.
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
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Could not load your orders.";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);
async function cancelOrder(order: Order) {
    if (
      !window.confirm(
        `Cancel ${order.productName} (#${order.orderNumber}) and request a Stripe refund?`
      )
    )
      return;
    setCancelling(order.orderNumber);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel order.");
      if (data.order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === order.orderNumber ? { ...o, ...data.order } : o
          )
        );
      }
      toast.success("Order cancelled — your refund is on its way.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not cancel order.";
      setError(message);
      toast.error(message);
    } finally {
      setCancelling("");
    }
  }

  const activeOrders = orders.filter((o) =>
    ["pending", "processing"].includes(o.fulfillmentStatus)
  );
  const pastOrders = orders.filter((o) =>
    !["pending", "processing"].includes(o.fulfillmentStatus)
  );

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
            {orders.length
              ? `You have ${orders.length} order${orders.length === 1 ? "" : "s"} linked to your account.`
              : "Orders you place will appear here, linked to your account."}
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {loading && <div className="empty-note">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="empty-note">
            You don't have any orders yet. Orders you place will appear here.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="order-list">
            {activeOrders.length > 0 && (
              <div className="order-group">
                <div className="order-group__heading">In progress</div>
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.orderNumber}
                    order={order}
                    cancelling={cancelling === order.orderNumber}
                    onCancel={cancelOrder}
                  />
                ))}
              </div>
            )}

            {pastOrders.length > 0 && (
              <div className="order-group">
                <div className="order-group__heading">Past orders</div>
                {pastOrders.map((order) => (
                  <OrderCard
                    key={order.orderNumber}
                    order={order}
                    cancelling={false}
                    onCancel={cancelOrder}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
function OrderCard({
  order,
  cancelling,
  onCancel,
}: {
  order: Order;
  cancelling: boolean;
  onCancel: (order: Order) => void;
}) {
  const canCancel = ["pending", "processing"].includes(order.fulfillmentStatus);
  const orderedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : "";
  const trackingUrl = courierTrackerUrl(
    order.shippingCarrier,
    order.shippingNumber
  );

  return (
    <article className="order-card">
      <div className="order-card__head">
        <div>
          <div className="order-card__number">#{order.orderNumber}</div>
          <div className="order-card__date">
            {orderedAt && `Placed ${orderedAt}`}
          </div>
        </div>
        <span className={`status-badge status-badge--${order.fulfillmentStatus}`}>
          {order.fulfillmentStatus}
        </span>
      </div>

      <div className="order-card__product">{order.productName}</div>

      <dl className="order-card__details">
        <div>
          <dt>Quantity</dt>
          <dd>{order.quantity}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{order.paymentStatus}</dd>
        </div>
      </dl>

      {order.shippingNumber ? (
        <div className="order-card__shipping">
          <div className="order-card__shipping-label">📦 Shipping tracking</div>
          {order.shippingCarrier && (
            <span className="order-card__courier">{order.shippingCarrier}</span>
          )}
          <code className="order-card__tracking">{order.shippingNumber}</code>
          <div className="order-card__track-actions">
            {trackingUrl && order.shippingCarrier && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary order-card__track-link"
              >
                Track package on {order.shippingCarrier} ↗
              </a>
            )}
            <span className="form__note">
              {trackingUrl && order.shippingCarrier
                ? "Opens the courier's tracking page with your number."
                : `Use this number with ${
                    order.shippingCarrier || "your courier"
                  } to follow your delivery.`}
            </span>
          </div>
        </div>
      ) : ["shipped", "completed"].includes(order.fulfillmentStatus) ? (
        <div className="order-card__shipping order-card__shipping--pending">
          <div className="order-card__shipping-label">📦 Order dispatched</div>
          Your order is on its way — the courier and tracking number will appear
          here once available.
        </div>
      ) : null}

      {canCancel ? (
        <div className="order-card__actions">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={cancelling}
            onClick={() => onCancel(order)}
          >
            {cancelling ? "Cancelling..." : "Cancel order and refund"}
          </button>
        </div>
      ) : order.fulfillmentStatus === "completed" ? (
        <div className="order-card__actions">
          <a
            className="btn btn--primary"
            href={`/api/invoices/${encodeURIComponent(order.orderNumber)}`}
            download
          >
            ⬇ Download invoice{order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""}
          </a>
        </div>
      ) : null}
    </article>
  );
}