"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Booking = {
  _id: string;
  bookingNumber: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  brandName: string;
  deviceName: string;
  services: { name: string; lineTotal: number }[];
  total: number;
  pickupDate: string | null;
  status: string;
  createdAt: string | null;
  addressLabel?: string;
  addressLine: string;
  addressCity: string;
  addressPostcode: string;
  repairMode?: string;
};

const STATUSES = ["new", "confirmed", "scheduled", "in_progress", "completed", "cancelled"];

export default function RepairBookingsManager() {
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/repair-bookings");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load bookings.");
    setBookings(data.bookings ?? []);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load bookings."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/repair-bookings/${id}`, {
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
    setBookings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, status: data.booking.status } : b))
    );
    toast.success(`Booking marked as "${data.booking.status}".`);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this booking?")) return;
    const res = await fetch(`/api/admin/repair-bookings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not delete booking.");
      toast.error(data.error || "Could not delete booking.");
      return;
    }
    setBookings((prev) => prev.filter((b) => b._id !== id));
    toast.success("Booking deleted.");
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Repair bookings"
      lead="Bookings placed through the public repair flow — update status as jobs progress."
    >
      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No repair bookings yet."
        rows={bookings}
        columns={[
          {
            key: "bookingNumber",
            header: "Booking",
            render: (row) => (
              <>
                <strong className="tracking-id">{row.bookingNumber}</strong>
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
            key: "address",
            header: "Address",
            render: (row) => (
              <small>
                {row.repairMode === "store" && <em>Store pickup — </em>}
                {row.addressLabel ? `${row.addressLabel}: ` : ""}
                {row.addressLine}
                <br />
                {row.addressCity} {row.addressPostcode}
              </small>
            ),
          },
          {
            key: "device",
            header: "Device",
            render: (row) => `${row.brandName} ${row.deviceName}`,
          },
          {
            key: "services",
            header: "Services",
            render: (row) => (
              <small>
                {row.services.map((s) => s.name).join(", ")}
                <br />
                {formatPrice(row.total)}
              </small>
            ),
          },
          {
            key: "pickupDate",
            header: "Pickup",
            render: (row) =>
              row.pickupDate ? new Date(row.pickupDate).toLocaleDateString("en-GB") : "—",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <select
                value={row.status}
                onChange={(e) => updateStatus(row._id, e.target.value)}
              >
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
