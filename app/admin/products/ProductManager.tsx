"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

type Product = {
  _id: string;
  name: string;
  description: string;
  category?: string;
  condition: "new" | "second-hand";
  price: number;
  imageUrl: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [categoryName, setCategoryName] = useState("");
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
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: data });
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploaded.error?.message || "Image upload failed.");
      setForm((current) => ({ ...current, imageUrl: uploaded.secure_url, imagePublicId: uploaded.public_id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const name = categoryName.trim();
    if (!name) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not create category.");
    setCategories((current) => [...current, data.category]);
    setForm((current) => ({ ...current, category: data.category.name }));
    setCategoryName("");
  }

  async function removeCategory(id: string) {
    if (!window.confirm("Delete this category? Products keep their current label.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return setError(data.error || "Could not delete category.");
    }
    setCategories((current) => current.filter((c) => c._id !== id));
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not create product.");
    setProducts((current) => [data.product, ...current]);
    setForm(emptyForm);
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
      return;
    }
    const data = await res.json();
    setProducts((current) =>
      current.map((product) => (product._id === id ? { ...product, ...data.product } : product))
    );
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((current) => current.filter((product) => product._id !== id));
    else {
      const data = await res.json();
      setError(data.error || "Could not delete product.");
    }
  }
return (
    <section className="admin">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Store management</div>
          <h1 className="section__title">Add phones for sale</h1>
          <p className="section__lead">
            List new and second-hand devices with secure Stripe checkout.
          </p>
        </div>

        <div className="admin-toolbar">
          <button className="btn btn--ghost" onClick={() => router.push("/admin")}>
            Repair queries
          </button>
          <button className="btn btn--ghost" onClick={() => router.push("/admin/orders")}>
            Manage orders
          </button>
          <span className="form__note">
            {products.length} products · {categories.length} categories
          </span>
          <button className="btn btn--ghost" onClick={() => router.push("/store")}>
            View store
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="admin-grid admin-grid--two">
          <div className="form-card">
            <h2 className="admin-card-title">Categories</h2>
            <p className="form__note">
              Create the categories shown in the product dropdown below.
            </p>
            <form className="admin-inline-form" onSubmit={createCategory}>
              <input
                aria-label="New category name"
                placeholder="e.g. iPhone, Samsung, Accessories"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button type="submit" className="btn btn--primary">
                Add category
              </button>
            </form>
            <ul className="admin-category-list">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <span>{cat.name}</span>
                  <button
                    className="btn btn--ghost"
                    onClick={() => removeCategory(cat._id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="form__note">No categories yet — add your first one.</li>
              )}
            </ul>
          </div>
<form className="form-card product-admin-form" onSubmit={createProduct}>
            <h2 className="admin-card-title">Add a product</h2>
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
                {uploading ? "Uploading..." : "Add product"}
              </button>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />{" "}
                Featured
              </label>
            </div>
          </form>
        </div>
<div className="admin-product-list">
          {loading ? (
            <div className="empty-note">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="empty-note">No products yet — add your first phone above.</div>
          ) : (
            products.map((product) => (
              <article className="admin-product-row" key={product._id}>
                <img src={product.imageUrl} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    {product.category ? `${product.category} · ` : ""}
                    {product.condition} · {formatPrice(product.price)}
                  </small>
                </div>
                <label className="stock-control">
                  Stock{" "}
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) =>
                      updateProduct(product._id, { stock: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={product.active}
                    onChange={(e) =>
                      updateProduct(product._id, { active: e.target.checked })
                    }
                  />{" "}
                  Live
                </label>
                <button className="btn btn--ghost" onClick={() => removeProduct(product._id)}>
                  Delete
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}