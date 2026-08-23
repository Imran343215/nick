"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import type { BrandShape, DeviceShape, RepairServiceShape, ServiceTemplateShape } from "@/lib/repair-catalog";
import { formatPrice } from "@/lib/utils";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";

const emptyTemplateForm = {
  name: "",
  slug: "",
  icon: "",
  iconPublicId: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

const emptyServiceForm = {
  brand: "",
  device: "",
  serviceTemplate: "",
  name: "",
  slug: "",
  price: "",
  discountPrice: "",
  estimatedTime: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function RepairServicesManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"templates" | "services">("templates");
  const [brands, setBrands] = useState<BrandShape[]>([]);
  const [devices, setDevices] = useState<DeviceShape[]>([]);
  const [allDevices, setAllDevices] = useState<DeviceShape[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplateShape[]>([]);
  const [services, setServices] = useState<RepairServiceShape[]>([]);
  const [brandFilter, setBrandFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

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
    if (!res.ok) throw new Error(data.error || "Could not load devices.");
    setAllDevices(data.devices ?? []);
  }

  async function loadServiceTemplates() {
    const res = await fetch("/api/admin/service-templates");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load service templates.");
    setServiceTemplates(data.templates ?? []);
  }

  async function loadServices(deviceId?: string) {
    const query = deviceId && deviceId !== "all" ? `?deviceId=${deviceId}` : "";
    const res = await fetch(`/api/admin/repair-services${query}`);
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load services.");
    setServices(data.services ?? []);
  }

  useEffect(() => {
    Promise.all([loadBrands(), loadAllDevices(), loadServiceTemplates(), loadServices()])
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  const formDevices = useMemo(
    () =>
      serviceForm.brand
        ? allDevices.filter((d) => d.brand === serviceForm.brand)
        : [],
    [allDevices, serviceForm.brand]
  );

  const filterDevices = useMemo(
    () =>
      brandFilter === "all"
        ? allDevices
        : allDevices.filter((d) => d.brand === brandFilter),
    [allDevices, brandFilter]
  );

  const filteredServices = useMemo(() => {
    let rows = services;
    if (brandFilter !== "all") {
      rows = rows.filter((s) => {
        const device = allDevices.find((d) => d._id === s.device);
        return device?.brand === brandFilter;
      });
    }
    if (deviceFilter !== "all") {
      rows = rows.filter((s) => s.device === deviceFilter);
    }
    return rows;
  }, [services, brandFilter, deviceFilter, allDevices]);

  useEffect(() => {
    if (loading) return;
    const deviceId = deviceFilter !== "all" ? deviceFilter : undefined;
    loadServices(deviceId).catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load services.")
    );
  }, [deviceFilter]);

  useEffect(() => {
    if (brandFilter === "all") return;
    if (deviceFilter !== "all") {
      const device = allDevices.find((d) => d._id === deviceFilter);
      if (device && device.brand !== brandFilter) setDeviceFilter("all");
    }
  }, [brandFilter, deviceFilter, allDevices]);

  function resetTemplateForm() {
    setTemplateForm(emptyTemplateForm);
    setEditingTemplateId(null);
    setSlugTouched(false);
  }

  function resetServiceForm() {
    setServiceForm(emptyServiceForm);
    setEditingServiceId(null);
    setSlugTouched(false);
  }

  function startEditTemplate(template: ServiceTemplateShape) {
    setEditingTemplateId(template._id);
    setTemplateForm({
      name: template.name,
      slug: template.slug,
      icon: template.icon,
      iconPublicId: "",
      status: template.status,
      order: String(template.order),
    });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditService(service: RepairServiceShape) {
    const device = allDevices.find((d) => d._id === service.device);
    setEditingServiceId(service._id);
    setServiceForm({
      brand: device?.brand ?? "",
      device: service.device,
      serviceTemplate: service.serviceTemplate,
      name: service.name,
      slug: service.slug,
      price: String(service.price),
      discountPrice:
        service.discountPrice != null ? String(service.discountPrice) : "",
      estimatedTime: service.estimatedTime ?? "",
      status: service.status,
      order: String(service.order),
    });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleTemplateUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadCatalogImage(file);
      setTemplateForm((current) => ({
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

  async function handleTemplateSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name: templateForm.name.trim(),
      slug: templateForm.slug.trim(),
      icon: templateForm.icon,
      iconPublicId: templateForm.iconPublicId,
      status: templateForm.status,
      order: Number(templateForm.order),
    };

    const res = await fetch(
      editingTemplateId ? `/api/admin/service-templates/${editingTemplateId}` : "/api/admin/service-templates",
      {
        method: editingTemplateId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save service template.");

    await loadServiceTemplates();
    resetTemplateForm();
  }

  async function handleServiceSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      device: serviceForm.device,
      serviceTemplate: serviceForm.serviceTemplate,
      name: serviceForm.name.trim(),
      slug: serviceForm.slug.trim(),
      price: Number(serviceForm.price),
      discountPrice: serviceForm.discountPrice !== "" ? Number(serviceForm.discountPrice) : undefined,
      estimatedTime: serviceForm.estimatedTime.trim() || undefined,
      status: serviceForm.status,
      order: Number(serviceForm.order),
    };

    const res = await fetch(
      editingServiceId ? `/api/admin/repair-services/${editingServiceId}` : "/api/admin/repair-services",
      {
        method: editingServiceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save service.");

    await loadServices(deviceFilter !== "all" ? deviceFilter : undefined);
    resetServiceForm();
  }

  async function removeTemplate(id: string) {
    if (!window.confirm("Delete this service template? This will also remove all device services using this template.")) return;
    const res = await fetch(`/api/admin/service-templates/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete service template.");
    setServiceTemplates((current) => current.filter((t) => t._id !== id));
    if (editingTemplateId === id) resetTemplateForm();
  }

  async function removeService(id: string) {
    if (!window.confirm("Delete this repair service?")) return;
    const res = await fetch(`/api/admin/repair-services/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete service.");
    setServices((current) => current.filter((s) => s._id !== id));
    if (editingServiceId === id) resetServiceForm();
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Repair services"
      lead="Create service templates and assign them to devices with custom pricing."
    >
      {error && <div className="alert alert--error">{error}</div>}

      {/* Tab Navigation */}
      <div className="admin-toolbar--compact">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={`btn ${activeTab === "templates" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("templates")}
          >
            Service Templates
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "services" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("services")}
          >
            Device Services
          </button>
        </div>
      </div>

      {activeTab === "templates" ? (
        <>
          <form className="form-card admin-form-card" onSubmit={handleTemplateSubmit}>
            <h2 className="admin-card-title">
              {editingTemplateId ? "Edit service template" : "Create service template"}
            </h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="template-name">Service name</label>
                <input
                  id="template-name"
                  required
                  value={templateForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setTemplateForm((current) => ({
                      ...current,
                      name,
                      slug: slugTouched ? current.slug : autoSlugFromName(name),
                    }));
                  }}
                  placeholder="Screen Replacement"
                />
              </div>
              <div className="field">
                <label htmlFor="template-slug">Slug</label>
                <input
                  id="template-slug"
                  required
                  value={templateForm.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setTemplateForm({ ...templateForm, slug: e.target.value });
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="template-order">Order</label>
                <input
                  id="template-order"
                  type="number"
                  value={templateForm.order}
                  onChange={(e) => setTemplateForm({ ...templateForm, order: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="template-status">Status</label>
                <select
                  id="template-status"
                  value={templateForm.status}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, status: e.target.value as "active" | "inactive" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="template-icon">Service icon</label>
                <input
                  id="template-icon"
                  type="file"
                  accept="image/*"
                  required={!templateForm.icon}
                  onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
                />
                {uploading && <span className="form__note">Uploading icon...</span>}
                {templateForm.icon && (
                  <img src={templateForm.icon} alt="Service icon preview" className="catalog-admin-thumb" />
                )}
              </div>
            </div>
            <div className="form__actions">
              <button className="btn btn--primary" type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : editingTemplateId ? "Save changes" : "Create template"}
              </button>
              {editingTemplateId && (
                <button type="button" className="btn btn--ghost" onClick={resetTemplateForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-panel">
            <div className="admin-panel__head">
              <h2 className="admin-card-title">Service Templates</h2>
              <span className="form__note">{serviceTemplates.length} templates</span>
            </div>
            <DataTable
              loading={loading}
              emptyMessage="No service templates yet — create one above."
              rows={serviceTemplates}
              columns={[
                {
                  key: "icon",
                  header: "Icon",
                  render: (row) => (
                    <img src={row.icon} alt="" className="catalog-admin-thumb catalog-admin-thumb--table" />
                  ),
                },
                { key: "name", header: "Service" },
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
                  <button type="button" className="btn btn--ghost" onClick={() => startEditTemplate(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => removeTemplate(row._id)}>
                    Delete
                  </button>
                </>
              )}
            />
          </div>
        </>
      ) : (
        <>
          <form className="form-card admin-form-card" onSubmit={handleServiceSubmit}>
            <h2 className="admin-card-title">
              {editingServiceId ? "Edit device service" : "Assign service to device"}
            </h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="service-brand">Brand</label>
                <select
                  id="service-brand"
                  required
                  value={serviceForm.brand}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, brand: e.target.value, device: "" })
                  }
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
                <label htmlFor="service-device">Device</label>
                <select
                  id="service-device"
                  required
                  value={serviceForm.device}
                  disabled={!serviceForm.brand}
                  onChange={(e) => setServiceForm({ ...serviceForm, device: e.target.value })}
                >
                  <option value="">Select a device</option>
                  {formDevices.map((device) => (
                    <option key={device._id} value={device._id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="service-template">Select Service</label>
                <div className="service-template-grid">
                  {serviceTemplates.map((template) => (
                    <label
                      key={template._id}
                      className={`service-template-card ${serviceForm.serviceTemplate === template._id ? "service-template-card--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="serviceTemplate"
                        value={template._id}
                        checked={serviceForm.serviceTemplate === template._id}
                        onChange={(e) => setServiceForm({ ...serviceForm, serviceTemplate: e.target.value, name: template.name })}
                        required
                      />
                      <img src={template.icon} alt={template.name} />
                      <span>{template.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="service-name">Service name (editable)</label>
                <input
                  id="service-name"
                  required
                  value={serviceForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setServiceForm((current) => ({
                      ...current,
                      name,
                      slug: slugTouched ? current.slug : autoSlugFromName(name),
                    }));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="service-slug">Slug</label>
                <input
                  id="service-slug"
                  required
                  value={serviceForm.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setServiceForm({ ...serviceForm, slug: e.target.value });
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="service-price">Price (GBP)</label>
                <input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="service-discount">Discount price (optional)</label>
                <input
                  id="service-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.discountPrice}
                  onChange={(e) => setServiceForm({ ...serviceForm, discountPrice: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="service-time">Estimated time (optional)</label>
                <input
                  id="service-time"
                  value={serviceForm.estimatedTime}
                  onChange={(e) => setServiceForm({ ...serviceForm, estimatedTime: e.target.value })}
                  placeholder="45 mins"
                />
              </div>
              <div className="field">
                <label htmlFor="service-order">Order</label>
                <input
                  id="service-order"
                  type="number"
                  value={serviceForm.order}
                  onChange={(e) => setServiceForm({ ...serviceForm, order: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="service-status">Status</label>
                <select
                  id="service-status"
                  value={serviceForm.status}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, status: e.target.value as "active" | "inactive" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form__actions">
              <button className="btn btn--primary" type="submit">
                {editingServiceId ? "Save changes" : "Assign service"}
              </button>
              {editingServiceId && (
                <button type="button" className="btn btn--ghost" onClick={resetServiceForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-panel">
            <div className="admin-panel__head">
              <h2 className="admin-card-title">Device Services</h2>
              <div className="admin-panel__filters">
                <label className="admin-filter">
                  Brand{" "}
                  <select
                    value={brandFilter}
                    onChange={(e) => {
                      setBrandFilter(e.target.value);
                      setDeviceFilter("all");
                    }}
                  >
                    <option value="all">All brands</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter">
                  Device{" "}
                  <select
                    value={deviceFilter}
                    onChange={(e) => setDeviceFilter(e.target.value)}
                  >
                    <option value="all">All devices</option>
                    {filterDevices.map((device) => (
                      <option key={device._id} value={device._id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="form__note">{filteredServices.length} shown</span>
              </div>
            </div>
            <DataTable
              loading={loading}
              emptyMessage="No device services yet — assign one above."
              rows={filteredServices}
              columns={[
                {
                  key: "icon",
                  header: "Icon",
                  render: (row) => (
                    <img src={row.icon} alt="" className="catalog-admin-thumb catalog-admin-thumb--table" />
                  ),
                },
                { key: "name", header: "Service" },
                {
                  key: "deviceName",
                  header: "Device",
                  render: (row) => row.deviceName ?? "—",
                },
                {
                  key: "brandName",
                  header: "Brand",
                  render: (row) => row.brandName ?? "—",
                },
                {
                  key: "price",
                  header: "Price",
                  render: (row) =>
                    row.discountPrice != null ? (
                      <>
                        <span className="price-strike">{formatPrice(row.price)}</span>{" "}
                        {formatPrice(row.discountPrice)}
                      </>
                    ) : (
                      formatPrice(row.price)
                    ),
                },
                {
                  key: "estimatedTime",
                  header: "Time",
                  render: (row) => row.estimatedTime ?? "—",
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
                  <button type="button" className="btn btn--ghost" onClick={() => startEditService(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => removeService(row._id)}>
                    Delete
                  </button>
                </>
              )}
            />
          </div>
        </>
      )}
    </AdminShell>
  );
}
