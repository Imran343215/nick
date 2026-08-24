"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import type { BrandShape, CategoryShape } from "@/lib/repair-catalog";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";

const emptyForm = {
  name: "",
  slug: "",
  logo: "",
  logoPublicId: "",
  categoryId: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function BrandsManager() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandShape[]>([]);
  const [categories, setCategories] = useState<CategoryShape[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/brands");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load brands.");
    setBrands(data.brands ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/repair-categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setCategories(data.categories ?? []);
      })
      .catch(() => undefined);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load brands."))
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

  function startEdit(brand: BrandShape) {
    setEditingId(brand._id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      logoPublicId: "",
      categoryId: brand.category ?? "",
      status: brand.status,
      order: String(brand.order),
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
        logo: uploaded.url,
        logoPublicId: uploaded.publicId,
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
      logo: form.logo,
      logoPublicId: form.logoPublicId,
      categoryId: form.categoryId,
      status: form.status,
      order: Number(form.order),
    };

    const res = await fetch(
      editingId ? `/api/admin/brands/${editingId}` : "/api/admin/brands",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save brand.");

    if (editingId) {
      setBrands((current) =>
        current.map((b) => (b._id === editingId ? data.brand : b))
      );
    } else {
      setBrands((current) => [...current, data.brand]);
    }
    resetForm();
    setShowForm(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this brand?")) return;
    const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete brand.");
    setBrands((current) => current.filter((b) => b._id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Brands"
      lead="Manage phone brands shown on the public repair catalog."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add brand
        </button>
        <span className="form__note">{brands.length} total</span>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <Modal
        open={showForm}
        title={editingId ? "Edit brand" : "Add brand"}
        onClose={closeModal}
      >
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="brand-name">Name</label>
            <input
              id="brand-name"
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
              placeholder="Apple"
            />
          </div>
          <div className="field">
            <label htmlFor="brand-slug">Slug</label>
            <input
              id="brand-slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              placeholder="apple"
            />
          </div>
          <div className="field">
            <label htmlFor="brand-order">Order</label>
            <input
              id="brand-order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="brand-category">Repair category</label>
            <select
              id="brand-category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="brand-status">Status</label>
            <select
              id="brand-status"
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
            <label htmlFor="brand-logo">Logo</label>
            <input
              id="brand-logo"
              type="file"
              accept="image/*"
              required={!form.logo}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {uploading && <span className="form__note">Uploading logo...</span>}
            {form.logo && (
              <img src={form.logo} alt="Brand logo preview" className="catalog-admin-thumb" />
            )}
          </div>
        </div>
        <div className="form__actions">
          <button className="btn btn--primary" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : editingId ? "Save changes" : "Add brand"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
      </Modal>

      <DataTable
          loading={loading}
          emptyMessage="No brands yet — use the Add brand button to create one."
          rows={brands}
          columns={[
            {
              key: "logo",
              header: "Logo",
              render: (row) => (
                <img src={row.logo} alt="" className="catalog-admin-thumb catalog-admin-thumb--table" />
              ),
            },
            { key: "name", header: "Name" },
            { key: "slug", header: "Slug" },
            {
              key: "categoryName",
              header: "Category",
              render: (row) => row.categoryName ?? "—",
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
