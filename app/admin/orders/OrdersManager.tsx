"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import { AvatarChip, StatusPill } from "@/components/admin/Pill";
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
      title="Orders"
    >
      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No orders yet."
        rows={orders}
        rowId={(row) => row.id}
        searchPlaceholder="Search orders by customer, email, order no…"
        searchKeys={["orderNumber", "customerName", "customerEmail", "productName"]}
        selectable
        exportable="orders.csv"
        toolbarActions={
          <button type="button" className="admin-table-tool-btn" onClick={() => load()}>
            Refresh
          </button>
        }
        columns={[
          {
            key: "orderNumber",
            header: "Order",
            sortable: true,
            sortValue: (row) => row.orderNumber,
            render: (row) => (
              <>
                <strong className="tracking-id">{row.orderNumber}</strong>
                <br />
                <small>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ""}</small>
              </>
            ),
          },
          {
            key: "customerName",
            header: "Customer",
            sortable: true,
            render: (row) => (
              <AvatarChip name={row.customerName} subtitle={row.customerEmail} />
            ),
          },
          {
            key: "productName",
            header: "Item",
            sortable: true,
            render: (row) => (
              <>
                {row.productName}
                <br />
                <small>
                  {row.quantity} × {formatPrice(row.unitPrice)} = {formatPrice(row.total)}
                </small>
              </>
            ),
          },
          {
            key: "paymentStatus",
            header: "Payment",
            sortable: true,
            render: (row) => <StatusPill status={row.paymentStatus} />,
          },
          {
            key: "fulfillmentStatus",
            header: "Status",
            sortable: true,
            render: (row) => (
              <>
                <select
                  value={row.fulfillmentStatus}
                  disabled={savingId === row.id}
                  aria-label={`Status for ${row.orderNumber}`}
                  onChange={(e) => save(row.id, { fulfillmentStatus: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ marginTop: "0.35rem" }}>
                  <StatusPill status={row.fulfillmentStatus} />
                </div>
              </>
            ),
          },
          {
            key: "shipping",
            header: "Shipping",
            hideable: false,
            render: (row) => (
              <span className="admin-ship">
                <input
                  aria-label="Courier"
                  placeholder="Courier…"
                  defaultValue={row.shippingCarrier}
                  disabled={savingId === row.id}
                  onBlur={(e) =>
                    row.shippingCarrier !== e.target.value &&
                    save(row.id, { shippingCarrier: e.target.value })
                  }
                />
                <input
                  aria-label="Tracking number"
                  placeholder="Tracking no…"
                  defaultValue={row.shippingNumber}
                  disabled={savingId === row.id}
                  onBlur={(e) =>
                    row.shippingNumber !== e.target.value &&
                    save(row.id, { shippingNumber: e.target.value })
                  }
                />
              </span>
            ),
          },
          {
            key: "invoice",
            header: "Invoice",
            render: (row) =>
              row.invoiceNumber || row.fulfillmentStatus === "completed" ? (
                <a className="admin-table-tool-btn" href={`/api/invoices/${encodeURIComponent(row.orderNumber)}`}>
                  ⬇ Invoice
                </a>
              ) : (
                <small className="form__note">On delivery</small>
              ),
          },
        ]}
      />
    </AdminShell>
  );
}