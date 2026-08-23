"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  cartSavings,
  cartSubtotal,
  cartTotal,
  clearCart,
  loadCart,
  type RepairCart,
} from "@/lib/repair-cart";
import RepairPriceSummary from "./RepairPriceSummary";

type SavedAddress = {
  _id: string;
  label: string;
  line1: string;
  city: string;
  postcode: string;
  phone: string;
  isDefault: boolean;
};

type PickupSlot = {
  iso: string;
  label: string;
  day: string;
  date: string;
};

function buildPickupSlots(count = 7): PickupSlot[] {
  const slots: PickupSlot[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "long" });
    const dateNum = d.getDate();
    const label = i === 1 ? "TOMORROW" : dayName.slice(0, 3).toUpperCase();
    slots.push({
      iso: d.toISOString().slice(0, 10),
      label,
      day: dayName,
      date: String(dateNum),
    });
  }
  return slots;
}

export default function RepairCheckout({
  brandSlug,
  deviceSlug,
}: {
  brandSlug: string;
  deviceSlug: string;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [cart, setCart] = useState<RepairCart | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    line1: "",
    city: "",
    postcode: "",
    phone: "",
  });
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    postcode: "",
  });
  const [pickupDate, setPickupDate] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickupSlots = useMemo(() => buildPickupSlots(), []);

  useEffect(() => {
    const existing = loadCart(brandSlug, deviceSlug);
    if (!existing || existing.selected.length === 0) {
      router.replace(`/repair/${brandSlug}/${deviceSlug}`);
      return;
    }
    setCart(existing);
    setCouponInput(existing.couponCode ?? "");
    setPickupDate(pickupSlots[0]?.iso ?? "");
  }, [brandSlug, deviceSlug, router, pickupSlots]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/repair-addresses")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.addresses?.length) {
          setAddresses(data.addresses);
          const defaultAddr =
            data.addresses.find((a: SavedAddress) => a.isDefault) ?? data.addresses[0];
          setSelectedAddressId(defaultAddr._id);
        } else {
          setShowAddressForm(true);
        }
      })
      .catch(() => undefined);
  }, [isSignedIn]);

  const subtotal = cart ? cartSubtotal(cart.selected) : 0;
  const total = cart ? cartTotal(subtotal, cart.couponDiscount) : 0;
  const savings = cart ? cartSavings(cart.selected, cart.couponDiscount) : 0;

  async function applyCoupon() {
    if (!cart) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/repair-coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon.");
      setCart({ ...cart, couponCode: data.code, couponDiscount: data.discount });
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Could not apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/repair-addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addressForm, isDefault: addresses.length === 0 }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not save address.");
    setAddresses((prev) => [...prev, data.address]);
    setSelectedAddressId(data.address._id);
    setShowAddressForm(false);
  }

  async function deleteAddress(id: string) {
    if (!window.confirm("Delete this address?")) return;
    const res = await fetch(`/api/repair-addresses/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setAddresses((prev) => prev.filter((a) => a._id !== id));
    if (selectedAddressId === id) setSelectedAddressId("");
  }

  async function placeOrder() {
    if (!cart || !agreedToTerms || !pickupDate) return;
    setLoading(true);
    setError("");

    let payload: Record<string, unknown>;
    const customMessage =
      sessionStorage.getItem(`repair-message:${brandSlug}:${deviceSlug}`) ?? "";

    if (isSignedIn) {
      const addr = addresses.find((a) => a._id === selectedAddressId);
      if (!addr) {
        setError("Select or add an address.");
        setLoading(false);
        return;
      }
      payload = {
        customerName: user?.fullName || "Customer",
        customerEmail: user?.primaryEmailAddress?.emailAddress,
        customerPhone: addr.phone,
        addressLabel: addr.label,
        addressLine: addr.line1,
        addressCity: addr.city,
        addressPostcode: addr.postcode,
      };
    } else {
      if (!guestForm.name || !guestForm.email || !guestForm.phone || !guestForm.line1) {
        setError("Fill in all contact and address fields.");
        setLoading(false);
        return;
      }
      payload = {
        customerName: guestForm.name,
        customerEmail: guestForm.email,
        customerPhone: guestForm.phone,
        addressLabel: "Other",
        addressLine: guestForm.line1,
        addressCity: guestForm.city,
        addressPostcode: guestForm.postcode,
      };
    }

    try {
      const res = await fetch("/api/repair-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          brandName: cart.brandName,
          deviceName: cart.deviceName,
          brandSlug: cart.brandSlug,
          deviceSlug: cart.deviceSlug,
          deviceImage: cart.deviceImage,
          services: cart.selected,
          couponCode: cart.couponCode,
          pickupDate,
          repairMode: "home",
          customMessage,
          agreedToTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order.");
      clearCart(brandSlug, deviceSlug);
      sessionStorage.removeItem(`repair-message:${brandSlug}:${deviceSlug}`);
      router.push(
        `/repair/${brandSlug}/${deviceSlug}/success?tracking=${encodeURIComponent(data.booking.trackingId)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
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
        <Link href="/repair">All brands</Link>
        <span>/</span>
        <Link href={`/repair/${brandSlug}`}>{cart.brandName}</Link>
        <span>/</span>
        <Link href={`/repair/${brandSlug}/${deviceSlug}`}>{cart.deviceName}</Link>
        <span>/</span>
        <span>Checkout</span>
      </nav>

      <h1 style={{ fontFamily: "var(--display)", fontSize: "2rem", marginBottom: "1.5rem" }}>
        You are almost done!
      </h1>

      <div className="repair-booking__layout">
        <div className="repair-booking__main">
          {error && <div className="alert alert--error">{error}</div>}

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">✓</span>
              <h2>Address</h2>
            </div>

            {!isSignedIn && (
              <div className="repair-checkout-guest">
                <p className="form__note">
                  Sign in to save addresses, or continue as guest below.
                </p>
                <SignInButton mode="modal">
                  <button type="button" className="btn btn--repair-outline">
                    Sign in
                  </button>
                </SignInButton>
                <div className="form-grid repair-guest-form">
                  <div className="field">
                    <label htmlFor="guest-name">Full name</label>
                    <input
                      id="guest-name"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="guest-email">Email</label>
                    <input
                      id="guest-email"
                      type="email"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="guest-phone">Phone</label>
                    <input
                      id="guest-phone"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="field field--full">
                    <label htmlFor="guest-line1">Address</label>
                    <input
                      id="guest-line1"
                      value={guestForm.line1}
                      onChange={(e) => setGuestForm({ ...guestForm, line1: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="guest-city">City</label>
                    <input
                      id="guest-city"
                      value={guestForm.city}
                      onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="guest-postcode">Postcode</label>
                    <input
                      id="guest-postcode"
                      value={guestForm.postcode}
                      onChange={(e) => setGuestForm({ ...guestForm, postcode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {isSignedIn && (
              <>
                <button
                  type="button"
                  className="btn btn--repair-outline repair-add-address"
                  onClick={() => setShowAddressForm((v) => !v)}
                >
                  + Add New Address
                </button>

                {showAddressForm && (
                  <form className="form-card repair-address-form" onSubmit={saveAddress}>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="addr-label">Label</label>
                        <select
                          id="addr-label"
                          value={addressForm.label}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, label: e.target.value })
                          }
                        >
                          <option value="Home">Home</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="field field--full">
                        <label htmlFor="addr-line1">Address</label>
                        <input
                          id="addr-line1"
                          required
                          value={addressForm.line1}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, line1: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="addr-city">City</label>
                        <input
                          id="addr-city"
                          required
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="addr-postcode">Postcode</label>
                        <input
                          id="addr-postcode"
                          required
                          value={addressForm.postcode}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, postcode: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="addr-phone">Phone</label>
                        <input
                          id="addr-phone"
                          required
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn--repair">
                      Save address
                    </button>
                  </form>
                )}

                {selectedAddressId && addresses.length > 0 && !showAddressForm && (
                  <div className="repair-address-selected">
                    {(() => {
                      const addr = addresses.find((a) => a._id === selectedAddressId);
                      if (!addr) return null;
                      return (
                        <>
                          <div className="repair-address-selected__info">
                            <strong>{addr.label}</strong>
                            <p>{addr.line1}, {addr.city} {addr.postcode}</p>
                            <small>{addr.phone}</small>
                          </div>
                          <button
                            type="button"
                            className="btn btn--ghost repair-address-selected__edit"
                            onClick={() => setShowAddressForm(true)}
                          >
                            Edit
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}

                <ul className="repair-address-list">
                  {addresses.map((addr) => (
                    <li key={addr._id}>
                      <label className="repair-address-card">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                        />
                        <div>
                          <strong>{addr.label}</strong>
                          <p>
                            {addr.line1}, {addr.city} {addr.postcode}
                          </p>
                          <small>{addr.phone}</small>
                        </div>
                      </label>
                      <div className="repair-address-actions">
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => deleteAddress(addr._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                  {addresses.length === 0 && !showAddressForm && (
                    <li className="form__note">No saved addresses — add one above.</li>
                  )}
                </ul>
              </>
            )}
          </section>

          <section className="repair-checkout-step">
            <div className="repair-checkout-step__head">
              <span className="repair-checkout-step__num">2</span>
              <div>
                <h2>Pickup Slot</h2>
                <p className="form__note">
                  Choose preferred date for repair expert to visit you.
                </p>
              </div>
            </div>
            <div className="repair-pickup-slots" role="listbox" aria-label="Pickup dates">
              {pickupSlots.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  role="option"
                  aria-selected={pickupDate === slot.iso}
                  className={`repair-pickup-slot${pickupDate === slot.iso ? " repair-pickup-slot--active" : ""}`}
                  onClick={() => setPickupDate(slot.iso)}
                >
                  <span className="repair-pickup-slot__label">{slot.label}</span>
                  <span className="repair-pickup-slot__date">{slot.date}</span>
                  <span className="repair-pickup-slot__day">{slot.day}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <RepairPriceSummary
          brandName={cart.brandName}
          deviceName={cart.deviceName}
          selected={cart.selected}
          subtotal={subtotal}
          couponCode={cart.couponCode}
          couponDiscount={cart.couponDiscount}
          couponInput={couponInput}
          onCouponInputChange={setCouponInput}
          onApplyCoupon={applyCoupon}
          applyingCoupon={applyingCoupon}
          couponError={couponError}
          total={total}
          savings={savings}
          agreedToTerms={agreedToTerms}
          onAgreedChange={setAgreedToTerms}
          actionLabel={loading ? "Placing order..." : "Place Order"}
          onAction={placeOrder}
          actionDisabled={loading || !agreedToTerms || !pickupDate}
          showCoupon={false}
        />
      </div>
    </div>
  );
}
