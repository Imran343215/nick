"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";

const STATUSES = ["new", "contacted", "quoted", "completed", "closed"];

interface QueryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  deviceBrand: string;
  deviceModel: string;
  issue: string;
  message: string;
  preferredDate?: string | null;
  status: string;
  trackingId: string;
  createdAt?: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/queries");
      const data = await res.json();
      if (res.status === 401) throw new Error("Session expired. Please sign in again.");
      if (!res.ok) throw new Error(data.error || "Could not load queries.");
      setQueries(data.queries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load queries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    try {
      setError("");
      const res = await fetch(`/api/queries/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/admin");
        router.refresh();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not delete.");
      }
      setQueries((q) => q.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      setError("");
      const res = await fetch(`/api/queries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.push("/admin");
        router.refresh();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not update status.");
      }
      setQueries((q) =>
        q.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <AdminShell
      eyebrow="Back office"
      title="Repair Queries"
      lead="Every query submitted on the landing page, stored in MongoDB."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button className="btn btn--ghost" onClick={() => load()}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <span className="form__note">{queries.length} total</span>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No queries yet. Submit one from the landing page quote form."
        rows={queries.map((q) => ({ ...q, _id: q.id }))}
        columns={[
          {
            key: "trackingId",
            header: "Tracking ID",
            render: (row) => <strong className="tracking-id">{row.trackingId}</strong>,
          },
          {
            key: "customer",
            header: "Customer",
            render: (row) => (
              <>
                {row.name}
                <br />
                <small>
                  {row.email}
                  <br />
                  {row.phone}
                </small>
              </>
            ),
          },
          {
            key: "device",
            header: "Device",
            render: (row) => `${row.deviceBrand} ${row.deviceModel}`,
          },
          { key: "issue", header: "Issue" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <select
                value={row.status}
                onChange={(e) => updateStatus(row.id, e.target.value)}
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
          <button className="btn btn--ghost" onClick={() => remove(row.id)}>
            Delete
          </button>
        )}
      />
    </AdminShell>
  );
}