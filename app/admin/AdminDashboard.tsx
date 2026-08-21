"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <section className="admin">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Back office</div>
          <h1 className="section__title">Repair Queries</h1>
          <p className="section__lead">
            Every query submitted on the landing page, stored in MongoDB.
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="admin-toolbar">
          <button className="btn btn--ghost" onClick={() => load()}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <span className="form__note">{queries.length} total</span>
          <button className="btn btn--ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>

        {queries.length === 0 && !loading ? (
          <div className="empty-note">
            No queries yet. Submit one from the landing page quote form.
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-row--head">
              <span>Tracking ID</span>
              <span>Customer</span>
              <span>Device</span>
              <span>Issue</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {queries.map((q) => (
              <div className="admin-row" key={q.id}>
                <strong className="tracking-id">{q.trackingId}</strong>
                <span>
                  {q.name}
                  <br />
                  <small>
                    {q.email}
                    <br />
                    {q.phone}
                  </small>
                </span>
                <span>
                  {q.deviceBrand} {q.deviceModel}
                </span>
                <span>{q.issue}</span>
                <select
                  value={q.status}
                  onChange={(e) => updateStatus(q.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="btn btn--ghost" onClick={() => remove(q.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}