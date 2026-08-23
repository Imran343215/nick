"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import type { ServiceTemplateShape } from "@/lib/repair-catalog";
import { autoSlugFromName, uploadCatalogImage } from "@/lib/upload";

const emptyTemplateForm = {
  name: "",
  slug: "",
  icon: "",
  iconPublicId: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function RepairServicesManager() {
  const router = useRouter();
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplateShape[]>([]);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  async function loadServiceTemplates() {
    const res = await fetch("/api/admin/service-templates");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load service templates.");
    setServiceTemplates(data.templates ?? []);
  }

  useEffect(() => {
    loadServiceTemplates()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load service templates."))
      .finally(() => setLoading(false));
  }, []);

  function resetTemplateForm() {
    setTemplateForm(emptyTemplateForm);
    setEditingTemplateId(null);
    setSlugTouched(false);
  }

  function openAdd() {
    resetTemplateForm();
    setShowTemplateForm(true);
  }

  function closeModal() {
    setShowTemplateForm(false);
    resetTemplateForm();
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
    setShowTemplateForm(true);
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
      editingTemplateId
        ? `/api/admin/service-templates/${editingTemplateId}`
        : "/api/admin/service-templates",
      {
        method: editingTemplateId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save service template.");

    await loadServiceTemplates();
    closeModal();
  }

  async function removeTemplate(id: string) {
    if (
      !window.confirm(
        "Delete this service template? This will also remove all device services using this template."
      )
    )
      return;
    const res = await fetch(`/api/admin/service-templates/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete service template.");
    setServiceTemplates((current) => current.filter((t) => t._id !== id));
    if (editingTemplateId === id) resetTemplateForm();
  }

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Service templates"
      lead="Create reusable repair services (e.g. Screen Replacement) that can then be assigned to devices on the Device services page."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Create template
        </button>
        <span className="form__note">{serviceTemplates.length} templates</span>
      </div>

      {error && !showTemplateForm && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No service templates yet — use the Create template button."
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

      <Modal
        open={showTemplateForm}
        title={editingTemplateId ? "Edit service template" : "Create service template"}
        onClose={closeModal}
      >
        {error && showTemplateForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleTemplateSubmit}>
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
                  setTemplateForm({
                    ...templateForm,
                    status: e.target.value as "active" | "inactive",
                  })
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
                <img
                  src={templateForm.icon}
                  alt="Service icon preview"
                  className="catalog-admin-thumb"
                />
              )}
            </div>
          </div>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : editingTemplateId ? "Save changes" : "Create template"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
