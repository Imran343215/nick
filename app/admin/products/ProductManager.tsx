"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

type Product = { _id: string; name: string; description: string; condition: "new" | "second-hand"; price: number; imageUrl: string; stock: number; active: boolean; featured: boolean };
const emptyForm = { name: "", description: "", condition: "second-hand", price: "", stock: "1", imageUrl: "", imagePublicId: "", active: true, featured: false };

export default function ProductManager() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load products.");
    setProducts(data.products ?? []);
  }

  useEffect(() => { load().catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);

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
    } catch (err) { setError(err instanceof Error ? err.message : "Image upload failed."); }
    finally { setUploading(false); }
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not create product.");
    setProducts((current) => [data.product, ...current]);
    setForm(emptyForm);
  }

  async function updateProduct(id: string, update: Record<string, boolean | number>) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
    if (!res.ok) { const data = await res.json(); setError(data.error || "Could not update product."); return; }
    const data = await res.json();
    setProducts((current) => current.map((product) => product._id === id ? { ...product, ...data.product } : product));
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((current) => current.filter((product) => product._id !== id));
  }

  return <section className="admin"><div className="container"><div className="section__header"><div className="section__eyebrow">Store management</div><h1 className="section__title">Add phones for sale</h1><p className="section__lead">List new and second-hand devices with secure Stripe checkout.</p></div><div className="admin-toolbar"><button className="btn btn--ghost" onClick={() => router.push("/admin")}>Repair queries</button><span className="form__note">{products.length} products</span><button className="btn btn--ghost" onClick={() => router.push("/store")}>View store</button></div>{error && <div className="alert alert--error">{error}</div>}<form className="form-card product-admin-form" onSubmit={createProduct}><h2>Add a product</h2><div className="form-grid"><div className="field"><label htmlFor="product-name">Product name</label><input id="product-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="iPhone 15 128GB" /></div><div className="field"><label htmlFor="product-condition">Condition</label><select id="product-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}><option value="new">New</option><option value="second-hand">Second hand</option></select></div><div className="field"><label htmlFor="product-price">Price GBP</label><input id="product-price" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div className="field"><label htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div><div className="field field--full"><label htmlFor="product-description">Description</label><textarea id="product-description" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="field field--full"><label htmlFor="product-image">Product image</label><input id="product-image" type="file" accept="image/*" required={!form.imageUrl} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />{uploading && <span className="form__note">Uploading image...</span>}{form.imageUrl && <img src={form.imageUrl} alt="Selected product" className="product-admin-preview" />}</div></div><div className="form__actions"><button className="btn btn--primary" disabled={uploading}>{uploading ? "Uploading..." : "Add product"}</button><label className="check-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label></div></form><div className="admin-product-list">{loading ? <div className="empty-note">Loading products...</div> : products.map((product) => <article className="admin-product-row" key={product._id}><img src={product.imageUrl} alt="" /><div><strong>{product.name}</strong><small>{product.condition} · {formatPrice(product.price)}</small></div><label className="stock-control">Stock <input type="number" min="0" value={product.stock} onChange={(e) => updateProduct(product._id, { stock: Number(e.target.value) })} /></label><label className="check-label"><input type="checkbox" checked={product.active} onChange={(e) => updateProduct(product._id, { active: e.target.checked })} /> Live</label><button className="btn btn--ghost" onClick={() => removeProduct(product._id)}>Delete</button></article>)}</div></div></section>;
}