"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { formatPrice, firstError, nonNegativeNumber, requiredField } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Product = {
  _id: string;
  name: string;
  description: string;
  category?: string;
  condition: "new" | "second-hand";
  price: number;
  imageUrl: string;
  imagePublicId?: string;
  stock: number;
  active: boolean;
  featured: boolean;
};

type Category = { _id: string; name: string; slug: string };

const emptyForm = {
  name: "",
  description: "",
  category: "",
  condition: "second-hand",
  price: "",
  stock: "1",
  imageUrl: "",
  imagePublicId: "",
  active: true,
  featured: false,
};

export default function ProductManager() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load products.");
    setProducts(data.products ?? []);
  }

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (res.ok) setCategories(data.categories ?? []);
  }

  useEffect(() => {
    loadProducts()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load products."))
      .finally(() => setLoading(false));
    loadCategories().catch(() => undefined);
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const signRes = await fetch("/api/uploads/sign");
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error || "Could not prepare upload.");
      const data = new FormData();
      data.append("file", file);
      data.append("api_key", sign.apiKey);
      data.append("timestamp", String(sign.timestamp));
      data.append("folder", sign.folder);
      data.append("signature", sign.signature);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: data }
      );
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploaded.error?.message || "Image upload failed.");
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
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

  function startEdit(product: Product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category ?? "",
      condition: product.condition,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl,
      imagePublicId: product.imagePublicId ?? "",
      active: product.active,
      featured: product.featured,
    });
    setShowForm(true);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = firstError([
      requiredField(form.name, "Product name"),
      nonNegativeNumber(form.price, "Price"),
      nonNegativeNumber(form.stock, "Stock"),
      !form.imageUrl ? "Product image is required." : "",
    ]);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    const res = await fetch(
      editingId ? `/api/admin/products/${editingId}` : "/api/products",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save product.");
      toast.error(data.error || "Could not save product.");
      return;
    }

    if (editingId) {
      setProducts((current) =>
        current.map((product) => (product._id === editingId ? data.product : product))
      );
    } else {
      setProducts((current) => [data.product, ...current]);
    }
    closeModal();
    toast.success(editingId ? "Product updated." : "Product created.");
  }

  async function updateProduct(id: string, update: Record<string, boolean | number>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not update product.");
      toast.error(data.error || "Could not update product.");
      return;
    }
    const data = await res.json();
    setProducts((current) =>
      current.map((product) => (product._id === id ? { ...product, ...data.product } : product))
    );
    toast.success("Product updated.");
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((current) => current.filter((product) => product._id !== id));
      toast.success("Product deleted.");
    } else {
      const data = await res.json();
      setError(data.error || "Could not delete product.");
      toast.error(data.error || "Could not delete product.");
    }
  }

  return (
    <>
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add product
        </button>
        <div className="admin-panel__filters">
          <span className="form__note">
            {products.length} products · {categories.length} categories
          </span>
          <button className="btn btn--ghost" onClick={() => router.push("/store")}>
            View store
          </button>
        </div>
      </div>

      {error && !showForm && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No products yet — use the Add product button to create one."
        rows={products}
        columns={[
          {
            key: "image",
            header: "Image",
            render: (row) => (
              <img
                src={row.imageUrl}
                alt=""
                className="catalog-admin-thumb catalog-admin-thumb--table"
              />
            ),
          },
          {
            key: "name",
            header: "Product",
            render: (row) => (
              <>
                {row.name}
                <br />
                <small>
                  {row.category ? `${row.category} · ` : ""}
                  {row.condition}
                </small>
              </>
            ),
          },
          {
            key: "price",
            header: "Price",
            render: (row) => formatPrice(row.price),
          },
          {
            key: "stock",
            header: "Stock",
            render: (row) => (
              <input
                type="number"
                min="0"
                aria-label={`Stock for ${row.name}`}
                value={row.stock}
                onChange={(e) => updateProduct(row._id, { stock: Number(e.target.value) })}
              />
            ),
          },
          {
            key: "active",
            header: "Live",
            render: (row) => (
              <input
                type="checkbox"
                checked={row.active}
                aria-label={`Live status for ${row.name}`}
                onChange={(e) => updateProduct(row._id, { active: e.target.checked })}
              />
            ),
          },
          {
            key: "featured",
            header: "Featured",
            render: (row) =>
              row.featured ? (
                <span className="status-pill status-pill--active">featured</span>
              ) : (
                "—"
              ),
          },
        ]}
        actions={(row) => (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => startEdit(row)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => removeProduct(row._id)}>
              Delete
            </button>
          </>
        )}
      />

      <Modal
        open={showForm}
        title={editingId ? "Edit product" : "Add product"}
        onClose={closeModal}
      >
        {error && showForm && <div className="alert alert--error">{error}</div>}
        <form className="form-card product-admin-form" onSubmit={saveProduct}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="product-name">Product name</label>
              <input
                id="product-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="iPhone 15 128GB"
              />
            </div>
            <div className="field">
              <label htmlFor="product-category">Category</label>
              <select
                id="product-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="product-condition">Condition</label>
              <select
                id="product-condition"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <option value="new">New</option>
                <option value="second-hand">Second hand</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="product-price">Price GBP</label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="field field--full">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field field--full">
              <label htmlFor="product-image">Product image</label>
              <input
                id="product-image"
                type="file"
                accept="image/*"
                required={!form.imageUrl}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              {uploading && <span className="form__note">Uploading image...</span>}
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Selected product" className="product-admin-preview" />
              )}
            </div>
          </div>
          <div className="form__actions">
            <button className="btn btn--primary" disabled={uploading}>
              {uploading ? "Uploading..." : editingId ? "Save changes" : "Add product"}
            </button>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />{" "}
              Featured
            </label>
            <button type="button" className="btn btn--ghost" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}