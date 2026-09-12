"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { clearSellCart, loadSellCart, sellCartQuote, type SellCart } from "@/lib/sell-cart";
import { useToast } from "@/components/ui/toast";
import { firstError, formatPrice, requiredField, validEmail, validPhone } from "@/lib/utils";

type PickupSlot = { iso: string; label: string; day: string; date: string };

function buildPickupSlots(count = 7): PickupSlot[] {
  const slots: PickupSlot[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "long" });
    const label = i === 1 ? "TOMORROW" : dayName.slice(0, 3).toUpperCase();
    slots.push({ iso: d.toISOString().slice(0, 10), label, day: dayName, date: String(d.getDate()) });
  }
  return slots;
}

export default function SellCheckout({
  brandSlug,
  deviceSlug,
}: {
  brandSlug: string;
  deviceSlug: string;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const toast = useToast();
  const pickupSlots = useMemo(() => buildPickupSlots(), []);

  const [cart, setCart] = useState<SellCart | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    postcode: "",
  });
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank_transfer">("upi");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = loadSellCart(brandSlug, deviceSlug);
    if (!existing || existing.answers.length === 0) {
      router.replace(`/sell/${brandSlug}/${deviceSlug}`);
      return;
    }
    setCart(existing);
    setPickupDate(pickupSlots[0]?.iso ?? "");
  }, [brandSlug, deviceSlug, router, pickupSlots]);

  useEffect(() => {
    if (isSignedIn && user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.fullName || "",
        email: prev.email || user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [isSignedIn, user]);

  const quote = cart ? sellCartQuote(cart) : 0;

  async function placeOrder() {
    if (!cart) return;
    if (!agreedToTerms) {
      const message = "Please agree to the Terms and Conditions to continue.";
      setError(message);
      toast.error(message);
      return;
    }
    if (!pickupDate) {
      const message = "Choose a pickup date to continue.";
      setError(message);
      toast.error(message);
      return;
    }

    const validationError = firstError([
      requiredField(form.name, "Full name"),
      requiredField(form.email, "Email"),
      validEmail(form.email),
      requiredField(form.phone, "Phone"),
      validPhone(form.phone),
      requiredField(form.line1, "Address"),
      requiredField(form.postcode, "Postcode"),
      requiredField(payoutDetails, payoutMethod === "upi" ? "UPI ID" : "Bank account details"),
    ]);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sell-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          brandName: cart.brandName,
          deviceName: cart.deviceName,
          brandSlug: cart.brandSlug,
          deviceSlug: cart.deviceSlug,
          deviceImage: cart.deviceImage,
          variantId: cart.variantId,
          answers: cart.answers.map((a) => ({ questionId: a.questionId, optionLabel: a.optionLabel })),
          addressLine: form.line1,
          addressCity: form.city,
          addressPostcode: form.postcode,
          pickupDate,
          payoutMethod,
          payoutDetails,
          customMessage,
          agreedToTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit sell request.");
      clearSellCart(brandSlug, deviceSlug);
      toast.success("Request submitted! Redirecting to your confirmation...");
      router.push(
        `/sell/${brandSlug}/${deviceSlug}/success?tracking=${encodeURIComponent(data.order.trackingId)}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit sell request.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || !cart) {
    return <div className="empty-note">Loading checkout...</div>;
  }

  return (
    <div className="repair-booking repair-checkout">
      <nav className="repair-breadcrumbs">
        <Link href="/sell">All brands</Link>
        <span>/</span>
        <Link href={`/sell/${brandSlug}`}>{cart.brandName}</Link>
        <span>/</span>
        <Link href={`/sell/${brandSlug}/${deviceSlug}`}>{cart.deviceName}</Link>
        <span>/</span>
        <span>Checkout</span>
      </nav>

      <h1 style={{ fontFamily: "var(--display)", fontSize: "2rem", marginBottom: "1.5rem" }}>
        Schedule your pickup
      </h1>

      <div className="repair-booking__layout">
        <div className="repair-booking__main">
          {error && <div className="alert alert--error">{error}</div>}

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">1</span>
              <h2>Your details</h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sell-name">Full name</label>
                <input
                  id="sell-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sell-email">Email</label>
                <input
                  id="sell-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sell-phone">Phone</label>
                <input
                  id="sell-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">2</span>
              <h2>Pickup address</h2>
            </div>
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="sell-line1">Address</label>
                <input
                  id="sell-line1"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sell-city">City</label>
                <input
                  id="sell-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sell-postcode">Postcode</label>
                <input
                  id="sell-postcode"
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">3</span>
              <h2>Pickup date</h2>
            </div>
            <div className="repair-service-grid">
              {pickupSlots.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  className={`btn ${pickupDate === slot.iso ? "btn--repair-remove" : "btn--repair-outline"}`}
                  onClick={() => setPickupDate(slot.iso)}
                >
                  {slot.label} {slot.date}
                </button>
              ))}
            </div>
          </section>

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">4</span>
              <h2>How should we pay you?</h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sell-payout-method">Payout method</label>
                <select
                  id="sell-payout-method"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as "upi" | "bank_transfer")}
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="sell-payout-details">
                  {payoutMethod === "upi" ? "UPI ID" : "Account number + IFSC"}
                </label>
                <input
                  id="sell-payout-details"
                  placeholder={payoutMethod === "upi" ? "yourname@upi" : "Account number + IFSC"}
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                />
              </div>
            </div>
            <p className="form__note">
              Payout is released after our team inspects the device and confirms the final quote at pickup.
            </p>
          </section>

          <div className="repair-custom-bar">
            <p>Anything else we should know?</p>
            <textarea
              rows={2}
              placeholder="Optional note for our team"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="repair-price-summary">
          <h2>Order summary</h2>
          <div className="repair-price-summary__items">
            <div className="repair-price-summary__item">
              <span className="repair-price-summary__item-name">
                {cart.deviceName} — {cart.variantLabel}
              </span>
              <span className="repair-price-summary__item-price">{formatPrice(cart.basePrice)}</span>
            </div>
            {cart.answers.map((a) => (
              <div className="repair-price-summary__item" key={a.questionId}>
                <span className="repair-price-summary__item-name">{a.optionLabel}</span>
                <span className="repair-price-summary__item-price">
                  {a.priceAdjustment >= 0 ? "+" : ""}
                  {formatPrice(a.priceAdjustment)}
                </span>
              </div>
            ))}
          </div>
          <div className="repair-price-summary__total">
            <span>Estimated payout</span>
            <strong>{formatPrice(quote)}</strong>
          </div>
          <label className="repair-price-summary__terms">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            I agree to the Terms and Conditions
          </label>
          <button type="button" className="btn btn--repair" disabled={loading} onClick={placeOrder}>
            {loading ? "Submitting..." : "Confirm — Get Paid"}
          </button>
        </div>
      </div>
    </div>
  );
}
