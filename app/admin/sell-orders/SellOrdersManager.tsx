"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Order = {
  _id: string;
  orderNumber: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  brandName: string;
  deviceName: string;
  variantLabel: string;
  finalQuote: number;
  payoutMethod: string;
  payoutDetails: string;
  addressLine: string;
  addressCity: string;
  addressPostcode: string;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
};

const STATUSES = ["new", "pickup_scheduled", "picked_up", "inspected", "paid", "rejected"];

export default function SellOrdersManager() {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/sell-orders");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load sell orders.");
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load sell orders."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/sell-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update status.");
      toast.error(data.error || "Could not update status.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: data.order.status } : o)));
    toast.success(`Order marked as "${data.order.status}".`);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this sell order?")) return;
    const res = await fetch(`/api/admin/sell-orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not delete order.");
      toast.error(data.error || "Could not delete order.");
      return;
    }
    setOrders((prev) => prev.filter((o) => o._id !== id));
    toast.success("Order deleted.");
  }

  return (
    <AdminShell
      eyebrow="Sell phone catalog"
      title="Sell orders"
      lead="Requests placed through the public Sell Phone flow — update status as pickup and payout progress."
    >
      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No sell requests yet."
        rows={orders}
        columns={[
          {
            key: "orderNumber",
            header: "Order",
            render: (row) => (
              <>
                <strong className="tracking-id">{row.orderNumber}</strong>
                <br />
                <small>{row.trackingId}</small>
              </>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (row) => (
              <>
                {row.customerName}
                <br />
                <small>
                  {row.customerEmail}
                  <br />
                  {row.customerPhone}
                </small>
              </>
            ),
          },
          {
            key: "device",
            header: "Device",
            render: (row) => `${row.brandName} ${row.deviceName} — ${row.variantLabel}`,
          },
          {
            key: "quote",
            header: "Quote",
            render: (row) => (
              <small>
                {formatPrice(row.finalQuote)}
                <br />
                {row.payoutMethod === "upi" ? "UPI" : "Bank transfer"}: {row.payoutDetails}
              </small>
            ),
          },
          {
            key: "address",
            header: "Pickup address",
            render: (row) => (
              <small>
                {row.addressLine}
                <br />
                {row.addressCity} {row.addressPostcode}
              </small>
            ),
          },
          {
            key: "pickupDate",
            header: "Pickup date",
            render: (row) => (row.pickupDate ? new Date(row.pickupDate).toLocaleDateString("en-GB") : "—"),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <select value={row.status} onChange={(e) => updateStatus(row._id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
        actions={(row) => (
          <button type="button" className="btn btn--ghost" onClick={() => remove(row._id)}>
            Delete
          </button>
        )}
      />
    </AdminShell>
  );
}
