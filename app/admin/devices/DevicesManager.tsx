"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import type { BrandShape, DeviceShape } from "@/lib/repair-catalog";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";

const emptyForm = {
  brand: "",
  name: "",
  slug: "",
  image: "",
  imagePublicId: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function DevicesManager() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandShape[]>([]);
  const [devices, setDevices] = useState<DeviceShape[]>([]);
  const [brandFilter, setBrandFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadBrands() {
    const res = await fetch("/api/admin/brands");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load brands.");
    setBrands(data.brands ?? []);
  }

  async function loadDevices(brandId?: string) {
    const query = brandId && brandId !== "all" ? `?brandId=${brandId}` : "";
    const res = await fetch(`/api/admin/devices${query}`);
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load devices.");
    setDevices(data.devices ?? []);
  }

  useEffect(() => {
    Promise.all([loadBrands(), loadDevices()])
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    loadDevices(brandFilter).catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load devices.")
    );
  }, [brandFilter]);

  const filteredDevices = useMemo(() => devices, [devices]);

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

  function startEdit(device: DeviceShape) {
    setEditingId(device._id);
    setForm({
      brand: device.brand,
      name: device.name,
      slug: device.slug,
      image: device.image,
      imagePublicId: "",
      status: device.status,
      order: String(device.order),
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
        image: uploaded.url,
        imagePublicId: uploaded.publicId,
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
      brand: form.brand,
      name: form.name.trim(),
      slug: form.slug.trim(),
      image: form.image,
      imagePublicId: form.imagePublicId,
      status: form.status,
      order: Number(form.order),
    };

    const res = await fetch(
      editingId ? `/api/admin/devices/${editingId}` : "/api/admin/devices",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save device.");

    await loadDevices(brandFilter);
    resetForm();
    setShowForm(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this device?")) return;
    const res = await fetch(`/api/admin/devices/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete device.");
    setDevices((current) => current.filter((d) => d._id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Devices"
      lead="Add device models under each brand for the repair catalog."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add device
        </button>
        <div className="admin-panel__filters">
          <label className="admin-filter">
            Brand{" "}
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <span className="form__note">{filteredDevices.length} shown</span>
        </div>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <Modal
        open={showForm}
        title={editingId ? "Edit device" : "Add device"}
        onClose={closeModal}
      >
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field field--full">
            <label htmlFor="device-brand">Brand</label>
            <select
              id="device-brand"
              required
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="device-name">Name</label>
            <input
              id="device-name"
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
              placeholder="iPhone 15 Pro"
            />
          </div>
          <div className="field">
            <label htmlFor="device-slug">Slug</label>
            <input
              id="device-slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="device-order">Order</label>
            <input
              id="device-order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="device-status">Status</label>
            <select
              id="device-status"
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
            <label htmlFor="device-image">Device image</label>
            <input
              id="device-image"
              type="file"
              accept="image/*"
              required={!form.image}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {uploading && <span className="form__note">Uploading image...</span>}
            {form.image && (
              <img src={form.image} alt="Device preview" className="catalog-admin-thumb" />
            )}
          </div>
        </div>
        <div className="form__actions">
          <button className="btn btn--primary" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : editingId ? "Save changes" : "Add device"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
      </Modal>

      <DataTable
          loading={loading}
          emptyMessage="No devices yet — use the Add device button to create one."
          rows={filteredDevices}
          columns={[
            {
              key: "image",
              header: "Image",
              render: (row) => (
                <img src={row.image} alt="" className="catalog-admin-thumb catalog-admin-thumb--table" />
              ),
            },
            { key: "name", header: "Name" },
            {
              key: "brandName",
              header: "Brand",
              render: (row) => row.brandName ?? "—",
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
