"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import AdminStatCards from "@/components/admin/StatCards";
import { AvatarChip, StatusPill, RowActions, IconButton, DeleteIcon } from "@/components/admin/Pill";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredOrders = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);
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
      title="Sell orders"
    >
      {error && <div className="alert alert--error">{error}</div>}

      <AdminStatCards
        stats={[
          { label: "Total requests", value: orders.length, icon: "📱", color: "purple" },
          {
            label: "New",
            value: orders.filter((o) => o.status === "new").length,
            icon: "🆕",
            color: "blue",
          },
          {
            label: "Picked up",
            value: orders.filter((o) => o.status === "picked_up").length,
            icon: "🚚",
            color: "orange",
          },
          {
            label: "Paid out",
            value: orders.filter((o) => o.status === "paid").length,
            icon: "💸",
            color: "green",
          },
          {
            label: "Rejected",
            value: orders.filter((o) => o.status === "rejected").length,
            icon: "✕",
            color: "red",
          },
        ]}
      />

      <DataTable
        loading={loading}
        emptyMessage="No sell requests yet."
        rows={filteredOrders}
        searchPlaceholder="Search sell orders by customer, phone, device…"
        searchKeys={["orderNumber", "trackingId", "customerName", "customerEmail", "customerPhone", "deviceName"]}
        selectable
        exportable="sell-orders.csv"
        filters={
          <label className="admin-table-filter">
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
        }
        columns={[
          {
            key: "orderNumber",
            header: "Order",
            sortable: true,
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
              <AvatarChip name={row.customerName} subtitle={`${row.customerEmail} • ${row.customerPhone}`} />
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
            sortable: true,
            sortValue: (row) => row.finalQuote,
            align: "right",
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
            sortable: true,
            sortValue: (row) => row.pickupDate ?? "",
            render: (row) => (row.pickupDate ? new Date(row.pickupDate).toLocaleDateString("en-GB") : "—"),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => (
              <>
                <select value={row.status} onChange={(e) => updateStatus(row._id, e.target.value)} aria-label={`Status for ${row.orderNumber}`}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: "0.35rem" }}>
                  <StatusPill status={row.status} />
                </div>
              </>
            ),
          },
        ]}
        actions={(row) => (
          <RowActions>
            <IconButton label={`Delete ${row.orderNumber}`} danger onClick={() => remove(row._id)}>
              <DeleteIcon />
            </IconButton>
          </RowActions>
        )}
      />
    </AdminShell>
  );
}
