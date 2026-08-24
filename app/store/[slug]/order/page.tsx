"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

type DeliveryMode = "delivery" | "collect";

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [form, setForm] = useState({
    line1: "",
    city: "",
    postcode: "",
    phone: "",
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("cancelled") ? "Checkout was cancelled. Your phone is still reserved while you decide." : "");

  if (!isLoaded) return <section className="section order-page"><div className="container"><div className="empty-note">Checking your account...</div></div></section>;

  if (!isSignedIn) return <section className="section order-page"><div className="container"><div className="form-card auth-card"><div className="section__eyebrow">Secure order</div><h1 className="section__title">Sign in to buy</h1><p className="section__lead">Create an account or sign in before continuing to checkout.</p><div className="auth-providers"><SignInButton mode="modal"><button className="btn btn--primary auth-provider">Sign in to continue</button></SignInButton><SignUpButton mode="modal"><button className="btn btn--ghost auth-provider">Create account</button></SignUpButton></div></div></div></section>;

  async function lookupPostcode(explicit?: string) {
    const postcode = (explicit ?? form.postcode).trim().toUpperCase().replace(/\s+/g, "");
    // Full UK postcode, e.g. NW64TA / M154QX / EC1A1BB
    const fullFormat = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(postcode);
    // Outcode / partial entry, e.g. NW6 / M15 / EC1A
    const partialFormat = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/.test(postcode);

    setSuggestions([]);

    if (!postcode) {
      setLookupMsg({ ok: false, text: "Type your postcode first." });
      return;
    }
    if (!fullFormat && !partialFormat) {
      setLookupMsg({ ok: false, text: "That doesn't look like a UK postcode — try e.g. NW6 4TA." });
      return;
    }

    setLookupLoading(true);
    setLookupMsg(null);
    try {
      let code = postcode;

      if (!fullFormat) {
        // Partial entry: ask postcodes.io for matching full postcodes.
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/autocomplete?limit=8`);
        const data = await res.json();
        const list: string[] = Array.isArray(data.result) ? data.result : [];
        if (list.length === 0) throw new Error("no matches");
        if (list.length > 1) {
          setSuggestions(list);
          setLookupMsg({ ok: true, text: "Pick your full postcode:" });
          return;
        }
        code = list[0].replace(/\s+/g, "");
      }

      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.result) throw new Error(data.error || "Postcode not found.");
      const match = Array.isArray(data.result) ? data.result[0] : data.result;
      const town = match.admin_district || match.region || "";
      setForm((prev) => ({
        ...prev,
        postcode: match.postcode || prev.postcode,
        city: town || prev.city,
      }));
      setLookupMsg({ ok: true, text: town ? `Found it — we filled in ${town} for you.` : "Postcode found." });
    } catch {
      setLookupMsg({ ok: false, text: "No postcode found for that — please double-check it." });
    } finally {
      setLookupLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (deliveryMode === "delivery" && (!form.line1.trim() || !form.city.trim() || !form.postcode.trim())) {
      setError("Fill in your address, or switch to collect from store.");
      return;
    }
    setLoading(true);
    try {
      const shippingAddress =
        deliveryMode === "collect"
          ? "Collect from Kilburn store"
          : [
              form.line1.trim(),
              form.city.trim(),
              form.postcode.toUpperCase().trim(),
              form.phone.trim() ? `Tel: ${form.phone.trim()}` : "",
            ]
              .filter(Boolean)
              .join(", ");
      const { slug } = await params;
      const productRes = await fetch(`/api/products/${slug}`);
      const productData = await productRes.json();
      if (!productRes.ok) throw new Error(productData.error || "Product not found.");
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: productData.product._id, shippingAddress }) });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <section className="section order-page">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Secure order</div>
          <h1 className="section__title">Complete your order</h1>
          <p className="section__lead">
            Signed in as {user?.primaryEmailAddress?.emailAddress}. Choose delivery or collection, then pay securely on Stripe.
          </p>
        </div>
        <form className="form-card order-form" onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}

          <div className="field field--full">
            <label htmlFor="order-mode-delivery">How would you like to get it?</label>
            <div className="order-delivery-options">
              <label
                className={`order-delivery-option${deliveryMode === "delivery" ? " order-delivery-option--active" : ""}`}
              >
                <input
                  id="order-mode-delivery"
                  type="radio"
                  name="fulfilment"
                  checked={deliveryMode === "delivery"}
                  onChange={() => setDeliveryMode("delivery")}
                />
                <span>
                  <strong>Deliver to my address</strong>
                  <small>We&apos;ll post it to your door</small>
                </span>
              </label>
              <label
                className={`order-delivery-option${deliveryMode === "collect" ? " order-delivery-option--active" : ""}`}
              >
                <input
                  id="order-mode-collect"
                  type="radio"
                  name="fulfilment"
                  checked={deliveryMode === "collect"}
                  onChange={() => setDeliveryMode("collect")}
                />
                <span>
                  <strong>Collect from Kilburn store</strong>
                  <small>Pick it up when it suits you</small>
                </span>
              </label>
            </div>
          </div>

          {deliveryMode === "delivery" && (
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="order-line1">Address</label>
                <input
                  id="order-line1"
                  required
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  placeholder="House number and street"
                />
              </div>
              <div className="field">
                <label htmlFor="order-city">City</label>
                <input
                  id="order-city"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="order-postcode">Postcode</label>
                <div className="postcode-row">
                  <input
                    id="order-postcode"
                    required
                    value={form.postcode}
                    onChange={(e) => {
                      setForm({ ...form, postcode: e.target.value });
                      setSuggestions([]);
                    }}
                    placeholder="e.g. NW6 4TA or just NW6"
                  />
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => lookupPostcode()}
                    disabled={lookupLoading}
                  >
                    {lookupLoading ? "Finding..." : "Find address"}
                  </button>
                </div>
                {lookupMsg && (
                  <small className={`postcode-msg postcode-msg--${lookupMsg.ok ? "ok" : "error"}`}>
                    {lookupMsg.text}
                  </small>
                )}
                {suggestions.length > 0 && (
                  <div className="postcode-suggestions">
                    {suggestions.map((code) => (
                      <button key={code} type="button" onClick={() => lookupPostcode(code)}>
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="field field--full">
                <label htmlFor="order-phone">Phone (for delivery updates)</label>
                <input
                  id="order-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          )}

          {deliveryMode === "collect" && (
            <p className="form__note">We&apos;ll email you as soon as your phone is ready for collection.</p>
          )}

          <button className="btn btn--primary" disabled={loading}>
            {loading ? "Opening secure checkout..." : "Continue to Stripe"}
          </button>
        </form>
      </div>
    </section>
  );
}