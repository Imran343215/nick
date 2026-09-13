"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { StatusPill, RowActions, IconButton, EditIcon, DeleteIcon } from "@/components/admin/Pill";
import type { BannerSlideShape, BannerSettingsShape } from "@/lib/banner";
import { uploadCatalogImage } from "@/lib/upload";
import { useToast } from "@/components/ui/toast";

const emptyForm = {
  imageUrl: "",
  imagePublicId: "",
  title: "",
  subtitle: "",
  buttonLabel: "",
  link: "",
  status: "active" as "active" | "inactive",
  order: "0",
};

export default function BannerManager() {
  const router = useRouter();
  const toast = useToast();
  const [slides, setSlides] = useState<BannerSlideShape[]>([]);
  const [settings, setSettings] = useState<BannerSettingsShape>({ enabled: true, autoplaySeconds: 5 });
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  async function loadSlides() {
    const res = await fetch("/api/admin/banner-slides");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load banner slides.");
    setSlides(data.slides ?? []);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/banner-settings");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load carousel settings.");
    setSettings(data.settings);
    setSettingsUpdatedAt(data.updatedAt ?? null);
  }

  useEffect(() => {
    Promise.all([loadSlides(), loadSettings()])
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        enabled: settings.enabled,
        autoplaySeconds: Number(settings.autoplaySeconds) || 5,
      };
      const res = await fetch("/api/admin/banner-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save settings.");
      setSettings(data.settings);
      setSettingsUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setEditingConfig(false);
      toast.success("Carousel settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

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

  function startEdit(slide: BannerSlideShape) {
    setEditingId(slide._id);
    setForm({
      imageUrl: slide.imageUrl,
      imagePublicId: "",
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      buttonLabel: slide.buttonLabel ?? "",
      link: slide.link ?? "",
      status: slide.status,
      order: String(slide.order),
    });
    setShowForm(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const uploaded = await uploadCatalogImage(file, "itechnick-banner");
      setForm((current) => ({ ...current, imageUrl: uploaded.url, imagePublicId: uploaded.publicId }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.imageUrl.trim()) {
      const message = "An image is required — a slide without one will never show on the site.";
      setError(message);
      toast.error(message);
      return;
    }

    const payload = {
      imageUrl: form.imageUrl.trim(),
      imagePublicId: form.imagePublicId.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      buttonLabel: form.buttonLabel.trim(),
      link: form.link.trim(),
      status: form.status,
      order: Number(form.order) || 0,
    };

    const res = await fetch(
      editingId ? `/api/admin/banner-slides/${editingId}` : "/api/admin/banner-slides",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save banner slide.");
      toast.error(data.error || "Could not save banner slide.");
      return;
    }

    await loadSlides();
    resetForm();
    setShowForm(false);
    toast.success(editingId ? "Slide updated." : "Slide created.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this slide?")) return;
    const res = await fetch(`/api/admin/banner-slides/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete slide.");
      toast.error(data.error || "Could not delete slide.");
      return;
    }
    setSlides((current) => current.filter((s) => s._id !== id));
    toast.success("Slide deleted.");
  }

  return (
    <AdminShell
      title="Banner"
      description="Carousel configuration and slide management."
    >
      {error && <div className="alert alert--error">{error}</div>}

      {/* ===== Config Table ===== */}
      <section className="admin-table-card">
        <header className="admin-table-card__header">
          <div>
            <h2 className="admin-table-card__title">Carousel Configuration</h2>
            <p className="admin-table-card__subtitle">
              Carousel-wide settings that control how the homepage banner behaves.
            </p>
          </div>
          {!editingConfig && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditingConfig(true)}
            >
              Edit
            </button>
          )}
        </header>

        {editingConfig ? (
          <form className="form-grid banner-config-form" onSubmit={saveSettings}>
            <div className="field">
              <label className="form__label">Carousel enabled</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                <span className="toggle__track" aria-hidden="true">
                  <span className="toggle__thumb" />
                </span>
                <span className="toggle__label">
                  {settings.enabled ? "Visible on site" : "Hidden on site"}
                </span>
              </label>
            </div>
            <div className="field">
              <label className="form__label" htmlFor="cfg-autoplay">
                Autoplay interval
              </label>
              <div className="banner-config-autoplay">
                <input
                  id="cfg-autoplay"
                  type="number"
                  min={2}
                  max={15}
                  value={settings.autoplaySeconds}
                  onChange={(e) =>
                    setSettings({ ...settings, autoplaySeconds: Number(e.target.value) || 5 })
                  }
                  className="form__input"
                />
                <span className="banner-config-autoplay__suffix">seconds per slide</span>
              </div>
              <p className="form__note">Between 2 and 15 seconds. Default is 5.</p>
            </div>
            <div className="form__actions form__actions--end">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setEditingConfig(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={savingSettings}>
                {savingSettings ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
        ) : (
          <div className="banner-config-view">
            <div className="banner-config-view__row">
              <span className="banner-config-view__label">Carousel</span>
              <span className="banner-config-view__value">
                <StatusPill status={settings.enabled ? "active" : "inactive"} />
                {settings.enabled ? "Visible on site" : "Hidden on site"}
              </span>
            </div>
            <div className="banner-config-view__row">
              <span className="banner-config-view__label">Autoplay interval</span>
              <span className="banner-config-view__value">
                {settings.autoplaySeconds} seconds per slide
              </span>
            </div>
            {settingsUpdatedAt && (
              <p className="form__note banner-config-view__updated">
                Last updated {new Date(settingsUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </section>

      <DataTable
        rows={slides}
        loading={loading}
        emptyMessage="No banner slides yet. Create your first slide to get started."
        searchPlaceholder="Search slides…"
        searchKeys={["title", "subtitle", "buttonLabel", "link"]}
        exportable="banner-slides.csv"
        toolbarActions={
          <button type="button" className="btn btn--primary btn--sm" onClick={openAdd}>
            + Add slide
          </button>
        }
        columns={[
          {
            key: "preview",
            header: "Preview",
            render: (row) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.imageUrl}
                alt={row.title || "Slide"}
                style={{ width: 80, height: 48, objectFit: "cover", borderRadius: 4 }}
              />
            ),
          },
          {
            key: "title",
            header: "Title",
            sortable: true,
            sortValue: (row) => row.title ?? "",
          },
          {
            key: "subtitle",
            header: "Subtitle",
            sortable: true,
            sortValue: (row) => row.subtitle ?? "",
            render: (row) => row.subtitle || "—",
          },
          {
            key: "buttonLabel",
            header: "Button",
            render: (row) => row.buttonLabel || "—",
          },
          {
            key: "link",
            header: "Link",
            render: (row) => row.link || "—",
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => <StatusPill status={row.status} />,
          },
          {
            key: "order",
            header: "Order",
            sortable: true,
            sortValue: (row) => row.order,
            align: "center",
          },
        ]}
        actions={(row) => (
          <RowActions>
            <IconButton label="Edit slide" onClick={() => startEdit(row)}>
              <EditIcon />
            </IconButton>
            <IconButton label="Delete slide" danger onClick={() => remove(row._id)}>
              <DeleteIcon />
            </IconButton>
          </RowActions>
        )}
      />

      <Modal open={showForm} title={editingId ? "Edit slide" : "Add slide"} onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field field--full">
            <label>Image (required)</label>
            <label className="order-delivery-option" style={{ marginBottom: "0.5rem" }}>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              {uploading ? "Uploading…" : "Upload image"}
            </label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://… (or upload above)"
            />
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt="Slide preview"
                className="catalog-admin-thumb"
                style={{ marginTop: "0.5rem" }}
              />
            )}
          </div>
          <div className="field field--full">
            <label htmlFor="bs-title">Title (optional overlay text)</label>
            <input
              id="bs-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="field field--full">
            <label htmlFor="bs-subtitle">Subtitle (optional)</label>
            <input
              id="bs-subtitle"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="bs-button">Button label (optional)</label>
            <input
              id="bs-button"
              value={form.buttonLabel}
              onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="bs-link">Click-through link (optional)</label>
            <input
              id="bs-link"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/repair or https://…"
            />
          </div>
          <div className="field">
            <label htmlFor="bs-status">Status</label>
            <select
              id="bs-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bs-order">Order</label>
            <input
              id="bs-order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? "Save changes" : "Create slide"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
