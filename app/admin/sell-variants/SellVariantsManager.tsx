"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { StatusPill, RowActions, IconButton, EditIcon, DeleteIcon } from "@/components/admin/Pill";
import type { BrandShape, DeviceShape } from "@/lib/repair-catalog";
import type { SellVariantShape } from "@/lib/sell-catalog";
import { firstError, formatPrice, nonNegativeNumber, requiredField } from "@/lib/utils";
import { autoSlugFromName } from "@/lib/upload";
import { useToast } from "@/components/ui/toast";

const emptyForm = {
  brand: "",
  device: "",
  label: "",
  slug: "",
  basePrice: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function SellVariantsManager() {
  const router = useRouter();
  const toast = useToast();
  const [brands, setBrands] = useState<BrandShape[]>([]);
  const [allDevices, setAllDevices] = useState<DeviceShape[]>([]);
  const [variants, setVariants] = useState<SellVariantShape[]>([]);
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  async function loadAllDevices() {
    const res = await fetch("/api/admin/devices");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load devices.");
    setAllDevices(data.devices ?? []);
  }

  async function loadVariants(deviceId?: string) {
    const query = deviceId && deviceId !== "all" ? `?deviceId=${deviceId}` : "";
    const res = await fetch(`/api/admin/sell-variants${query}`);
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load sell variants.");
    setVariants(data.variants ?? []);
  }

  useEffect(() => {
    Promise.all([loadBrands(), loadAllDevices(), loadVariants()])
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    loadVariants(deviceFilter).catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load sell variants.")
    );
  }, [deviceFilter]);

  const formDevices = useMemo(
    () => (form.brand ? allDevices.filter((d) => d.brand === form.brand) : []),
    [allDevices, form.brand]
  );

  const visibleVariants = useMemo(() => {
    const byDevice = deviceFilter === "all" ? variants : variants.filter((v) => v.device === deviceFilter);
    return byDevice;
  }, [variants, deviceFilter]);

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

  function startEdit(variant: SellVariantShape) {
    const device = allDevices.find((d) => d._id === variant.device);
    setEditingId(variant._id);
    setForm({
      brand: device?.brand ?? "",
      device: variant.device,
      label: variant.label,
      slug: variant.slug,
      basePrice: String(variant.basePrice),
      status: variant.status,
      order: String(variant.order),
    });
    setSlugTouched(true);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = firstError([
      requiredField(form.device, "Device"),
      requiredField(form.label, "Label"),
      nonNegativeNumber(form.basePrice, "Max price"),
    ]);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      device: form.device,
      label: form.label.trim(),
      slug: form.slug.trim(),
      basePrice: Number(form.basePrice),
      status: form.status,
      order: Number(form.order),
    };

    const res = await fetch(
      editingId ? `/api/admin/sell-variants/${editingId}` : "/api/admin/sell-variants",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save sell variant.");
      toast.error(data.error || "Could not save sell variant.");
      return;
    }

    await loadVariants(deviceFilter);
    resetForm();
    setShowForm(false);
    toast.success(editingId ? "Sell variant updated." : "Sell variant created.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this sell variant?")) return;
    const res = await fetch(`/api/admin/sell-variants/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete sell variant.");
      toast.error(data.error || "Could not delete sell variant.");
      return;
    }
    setVariants((current) => current.filter((v) => v._id !== id));
    if (editingId === id) resetForm();
    toast.success("Sell variant deleted.");
  }

  return (
    <AdminShell
      title="Sell variants"
      actions={
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add sell variant
        </button>
      }
    >
      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No sell variants yet — add one so a device shows up on the Sell Phone page."
        rows={visibleVariants}
        searchPlaceholder="Search variants…"
        searchKeys={["label", "deviceName", "brandName"]}
        selectable
        exportable="sell-variants.csv"
        filters={
          <label className="admin-table-filter">
            Device
            <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
              <option value="all">All devices</option>
              {allDevices.map((device) => (
                <option key={device._id} value={device._id}>
                  {device.brandName} {device.name}
                </option>
              ))}
            </select>
          </label>
        }
        columns={[
          {
            key: "device",
            header: "Device",
            sortable: true,
            sortValue: (row) => `${row.brandName ?? ""} ${row.deviceName ?? ""}`,
            render: (row) => `${row.brandName ?? ""} ${row.deviceName ?? ""}`,
          },
          { key: "label", header: "Variant", sortable: true },
          {
            key: "basePrice",
            header: "Max price",
            sortable: true,
            align: "right",
            render: (row) => formatPrice(row.basePrice),
          },
          { key: "status", header: "Status", sortable: true, render: (row) => <StatusPill status={row.status} /> },
          { key: "order", header: "Order", sortable: true },
        ]}
        actions={(row) => (
          <RowActions>
            <IconButton label={`Edit ${row.label}`} onClick={() => startEdit(row)}>
              <EditIcon />
            </IconButton>
            <IconButton label={`Delete ${row.label}`} danger onClick={() => remove(row._id)}>
              <DeleteIcon />
            </IconButton>
          </RowActions>
        )}
      />

      <Modal open={showForm} title={editingId ? "Edit sell variant" : "Add sell variant"} onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="sv-brand">Brand</label>
            <select
              id="sv-brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value, device: "" })}
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sv-device">Device</label>
            <select
              id="sv-device"
              value={form.device}
              onChange={(e) => setForm({ ...form, device: e.target.value })}
            >
              <option value="">Select device</option>
              {formDevices.map((device) => (
                <option key={device._id} value={device._id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sv-label">Label (e.g. 128GB / 8GB RAM)</label>
            <input
              id="sv-label"
              value={form.label}
              onChange={(e) => {
                const label = e.target.value;
                setForm((current) => ({
                  ...current,
                  label,
                  slug: slugTouched ? current.slug : autoSlugFromName(label),
                }));
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="sv-slug">Slug</label>
            <input
              id="sv-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="sv-price">Max price (best condition)</label>
            <input
              id="sv-price"
              type="number"
              min="0"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sv-status">Status</label>
            <select
              id="sv-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sv-order">Order</label>
            <input
              id="sv-order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? "Save changes" : "Create variant"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
