"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/ui/toast";

type Category = { _id: string; name: string; slug: string };

export default function ProductCategoriesManager() {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
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

  function closeModal() {
    setShowForm(false);
    setName("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Category name is required.");
      toast.error("Category name is required.");
      return;
    }
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create category.");
      toast.error(data.error || "Could not create category.");
      return;
    }
    setCategories((current) => [...current, data.category]);
    closeModal();
    toast.success("Category created.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this category? Products keep their current label.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete category.");
      toast.error(data.error || "Could not delete category.");
      return;
    }
    setCategories((current) => current.filter((c) => c._id !== id));
    toast.success("Category deleted.");
  }

  return (
    <>
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>
          + Add category
        </button>
        <span className="form__note">{categories.length} total</span>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <Modal open={showForm} title="Add category" onClose={closeModal}>
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card admin-form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="product-category-name">Name</label>
              <input
                id="product-category-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. iPhone, Samsung, Accessories"
              />
              <p className="form__note">
                These categories appear in the product form dropdown and on the store.
              </p>
            </div>
          </div>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit">
              Add category
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
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
        ]}
        actions={(row) => (
          <button type="button" className="btn btn--ghost" onClick={() => remove(row._id)}>
            Delete
          </button>
        )}
      />
    </>
  );
}
