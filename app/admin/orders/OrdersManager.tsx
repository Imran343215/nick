"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingAddress: string;
  shippingCarrier: string;
  shippingNumber: string;
  createdAt: string | null;
  invoiceNumber?: string | null;
};

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

export default function OrdersManager() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/orders");
      if (res.status === 401) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(
    id: string,
    update: { fulfillmentStatus?: string; shippingCarrier?: string; shippingNumber?: string }
  ) {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (res.status === 401) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update order.");
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data.order } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <AdminShell
      eyebrow="Back office"
      title="Orders"
      lead="Every store order placed through Stripe. Update fulfilment status and add the courier + tracking number, which customers see on My Orders."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <span className="form__note">{orders.length} orders</span>
        <button className="btn btn--ghost" onClick={() => load()}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

        {loading ? (
          <div className="empty-note">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-note">No orders yet.</div>
        ) : (
          <div className="admin-table admin-table--orders">
            <div className="admin-row admin-row--head admin-row--orders">
              <span>Order</span>
              <span>Customer</span>
              <span>Item</span>
              <span>Payment</span>
              <span>Invoice</span>
              <span>Status</span>
              <span>Shipping</span>
            </div>
            {orders.map((o) => (
              <div className="admin-row admin-row--orders" key={o.id}>
                <span>
                  <strong className="tracking-id">{o.orderNumber}</strong>
                  <br />
                  <small>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}
                  </small>
                </span>
                <span>
                  {o.customerName}
                  <br />
                  <small>
                    {o.customerEmail}
                    <br />
                    {o.shippingAddress || "No address"}
                  </small>
                </span>
                <span>
                  {o.productName}
                  <br />
                  <small>
                    {o.quantity} × {formatPrice(o.unitPrice)} = {formatPrice(o.total)}
                  </small>
                </span>
                <span>
                  <small>{o.paymentStatus}</small>
                </span>
                <span>
                  {o.invoiceNumber || o.fulfillmentStatus === "completed" ? (
                    <a
                      className="btn btn--ghost"
                      href={`/api/invoices/${encodeURIComponent(o.orderNumber)}`}
                    >
                      ⬇ Invoice
                    </a>
                  ) : (
                    <small className="form__note">On delivery</small>
                  )}
                </span>
                <span>
                  <select
                    value={o.fulfillmentStatus}
                    disabled={savingId === o.id}
                    onChange={(e) => save(o.id, { fulfillmentStatus: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </span>
                <span className="admin-ship">
                  <input
                    aria-label="Courier"
                    placeholder="Courier…"
                    defaultValue={o.shippingCarrier}
                    disabled={savingId === o.id}
                    onBlur={(e) =>
                      o.shippingCarrier !== e.target.value &&
                        save(o.id, { shippingCarrier: e.target.value })
                    }
                  />
                  <input
                    aria-label="Tracking number"
                    placeholder="Tracking no…"
                    defaultValue={o.shippingNumber}
                    disabled={savingId === o.id}
                    onBlur={(e) =>
                      o.shippingNumber !== e.target.value &&
                        save(o.id, { shippingNumber: e.target.value })
                    }
                  />
                </span>
              </div>
            ))}
          </div>
        )}
    </AdminShell>
  );
}