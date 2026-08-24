"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/ui/toast";

type Coupon = {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  status: "active" | "inactive";
  expiresAt: string | null;
};

const emptyForm = {
  code: "",
  discountType: "percent" as "percent" | "fixed",
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  status: "active" as "active" | "inactive",
  expiresAt: "",
};

export default function CouponsManager() {
  const router = useRouter();
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load coupons.");
    setCoupons(data.coupons ?? []);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load coupons."))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    resetForm();
  }

  function startEdit(coupon: Coupon) {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: String(coupon.value),
      minSubtotal: coupon.minSubtotal != null ? String(coupon.minSubtotal) : "",
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      status: coupon.status,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const value = Number(form.value);

    // Validation: code required, sensible discount values.
    const validationError =
      !form.code.trim()
        ? "Coupon code is required."
        : form.value === "" || !Number.isFinite(value) || value <= 0
          ? "Discount value must be greater than 0."
          : form.discountType === "percent" && value > 100
            ? "Percentage discount cannot be more than 100."
            : "";
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      code: form.code.trim(),
      discountType: form.discountType,
      value,
      minSubtotal: form.minSubtotal !== "" ? Number(form.minSubtotal) : undefined,
      maxDiscount: form.maxDiscount !== "" ? Number(form.maxDiscount) : undefined,
      status: form.status,
      expiresAt: form.expiresAt || undefined,
    };

    const res = await fetch(
      editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save coupon.");
      toast.error(data.error || "Could not save coupon.");
      return;
    }

    if (editingId) {
      setCoupons((prev) => prev.map((c) => (c._id === editingId ? data.coupon : c)));
    } else {
      setCoupons((prev) => [data.coupon, ...prev]);
    }
    resetForm();
    setShowForm(false);
    toast.success(editingId ? "Coupon updated." : "Coupon created.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not delete coupon.");
      toast.error(data.error || "Could not delete coupon.");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c._id !== id));
    if (editingId === id) resetForm();
    toast.success("Coupon deleted.");
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Coupons"
      lead="Create discount codes customers can apply at checkout (e.g. RPR50)."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add coupon
        </button>
        <span className="form__note">{coupons.length} total</span>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <Modal
        open={showForm}
        title={editingId ? "Edit coupon" : "Add coupon"}
        onClose={closeModal}
      >
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="coupon-code">Code</label>
            <input
              id="coupon-code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="RPR50"
            />
          </div>
          <div className="field">
            <label htmlFor="coupon-type">Type</label>
            <select
              id="coupon-type"
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })
              }
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="coupon-value">Value</label>
            <input
              id="coupon-value"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="coupon-min">Min subtotal (optional)</label>
            <input
              id="coupon-min"
              type="number"
              min="0"
              step="0.01"
              value={form.minSubtotal}
              onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="coupon-max">Max discount (optional)</label>
            <input
              id="coupon-max"
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscount}
              onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="coupon-expires">Expires (optional)</label>
            <input
              id="coupon-expires"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="coupon-status">Status</label>
            <select
              id="coupon-status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "active" | "inactive" })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary">
            {editingId ? "Save changes" : "Add coupon"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
      </Modal>

      <DataTable
        loading={loading}
        emptyMessage="No coupons yet — use the Add coupon button to create one."
        rows={coupons}
        columns={[
          { key: "code", header: "Code" },
          {
            key: "discountType",
            header: "Discount",
            render: (row) =>
              row.discountType === "percent" ? `${row.value}%` : `£${row.value.toFixed(2)}`,
          },
          {
            key: "minSubtotal",
            header: "Min order",
            render: (row) => (row.minSubtotal != null ? `£${row.minSubtotal}` : "—"),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`status-pill status-pill--${row.status === "active" ? "active" : "inactive"}`}
              >
                {row.status}
              </span>
            ),
          },
          {
            key: "expiresAt",
            header: "Expires",
            render: (row) =>
              row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("en-GB") : "—",
          },
        ]}
        actions={(row) => (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => startEdit(row)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => remove(row._id)}>
              Delete
            </button>
          </>
        )}
      />
    </AdminShell>
  );
}
