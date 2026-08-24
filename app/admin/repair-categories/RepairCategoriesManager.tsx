"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import type { CategoryShape } from "@/lib/repair-catalog";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";

const emptyForm = {
  name: "",
  slug: "",
  icon: "",
  iconPublicId: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function RepairCategoriesManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryShape[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/repair-categories");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load categories.");
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load categories."))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    resetForm();
  }

  function startEdit(category: CategoryShape) {
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      iconPublicId: "",
      status: category.status,
      order: String(category.order),
    });
    setSlugTouched(true);
    setShowForm(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadCatalogImage(file);
      setForm((current) => ({
        ...current,
        icon: uploaded.url,
        iconPublicId: uploaded.publicId,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon,
      iconPublicId: form.iconPublicId,
      status: form.status,
      order: Number(form.order),
    };

    const res = await fetch(
      editingId ? `/api/admin/repair-categories/${editingId}` : "/api/admin/repair-categories",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save category.");

    if (editingId) {
      setCategories((current) =>
        current.map((c) => (c._id === editingId ? data.category : c))
      );
    } else {
      setCategories((current) => [...current, data.category]);
    }
    resetForm();
    setShowForm(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this repair category?")) return;
    const res = await fetch(`/api/admin/repair-categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete category.");
    setCategories((current) => current.filter((c) => c._id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Categories"
      lead="Create repair categories (e.g. Mobile repair, Laptop repair). Brands are then assigned to a category, so customers pick a category first on the repair page."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add category
        </button>
        <span className="form__note">{categories.length} total</span>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <Modal
        open={showForm}
        title={editingId ? "Edit category" : "Add category"}
        onClose={closeModal}
      >
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="category-name">Name</label>
              <input
                id="category-name"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: slugTouched ? current.slug : autoSlugFromName(name),
                  }));
                }}
                placeholder="Mobile repair"
              />
            </div>
            <div className="field">
              <label htmlFor="category-slug">Slug</label>
              <input
                id="category-slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="mobile-repair"
              />
            </div>
            <div className="field">
              <label htmlFor="category-order">Order</label>
              <input
                id="category-order"
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="category-status">Status</label>
              <select
                id="category-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="field field--full">
              <label htmlFor="category-icon">Icon image</label>
              <input
                id="category-icon"
                type="file"
                accept="image/*"
                required={!form.icon}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              {uploading && <span className="form__note">Uploading icon...</span>}
              {form.icon && (
                <img src={form.icon} alt="Category icon preview" className="catalog-admin-thumb" />
              )}
            </div>
          </div>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : editingId ? "Save changes" : "Add category"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <DataTable
        loading={loading}
        emptyMessage="No categories yet — use the Add category button to create one."
        rows={categories}
        columns={[
          {
            key: "icon",
            header: "Icon",
            render: (row) => (
              <img src={row.icon} alt="" className="catalog-admin-thumb catalog-admin-thumb--table" />
            ),
          },
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
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
          { key: "order", header: "Order" },
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