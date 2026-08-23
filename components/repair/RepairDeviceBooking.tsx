"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BrandShape, DeviceShape, RepairServiceShape } from "@/lib/repair-catalog";
import {
  cartSavings,
  cartSubtotal,
  cartTotal,
  loadCart,
  saveCart,
  toggleServiceInCart,
  type RepairCart,
} from "@/lib/repair-cart";
import { formatPrice } from "@/lib/utils";
import RepairPriceSummary from "./RepairPriceSummary";

const FAQS = [
  {
    q: "When do I pay for the repair?",
    a: "Payment is collected after diagnosis. The prices shown are starting rates for common repairs.",
  },
  {
    q: "Will I get an invoice?",
    a: "Yes — we email a receipt and booking confirmation with your tracking ID.",
  },
  {
    q: "What if my issue is not listed?",
    a: "Use the message box below and our team will contact you with a custom quote.",
  },
];

const PROMO_CODE = "RPR50";

export default function RepairDeviceBooking({
  brand,
  device,
  services,
}: {
  brand: BrandShape;
  device: DeviceShape;
  services: RepairServiceShape[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<RepairCart | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const existing = loadCart(brand.slug, device.slug);
    if (existing) {
      setCart(existing);
      setCouponInput(existing.couponCode ?? "");
    } else {
      setCart({
        brandSlug: brand.slug,
        brandName: brand.name,
        deviceSlug: device.slug,
        deviceName: device.name,
        deviceImage: device.image,
        selected: [],
        couponDiscount: 0,
      });
    }
  }, [brand, device]);

  useEffect(() => {
    if (cart) saveCart(cart);
  }, [cart]);

  const selectedIds = useMemo(
    () => new Set(cart?.selected.map((s) => s.serviceId) ?? []),
    [cart]
  );

  const subtotal = cart ? cartSubtotal(cart.selected) : 0;
  const total = cart ? cartTotal(subtotal, cart.couponDiscount) : 0;
  const savings = cart ? cartSavings(cart.selected, cart.couponDiscount) : 0;

  function toggleService(service: RepairServiceShape) {
    if (!cart) return;
    const add = !selectedIds.has(service._id);
    const next = toggleServiceInCart(cart, service, add);
    setCart(next);
  }

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
      setCart({
        ...cart,
        couponCode: data.code,
        couponDiscount: data.discount,
      });
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Could not apply coupon.");
      setCart({ ...cart, couponCode: undefined, couponDiscount: 0 });
    } finally {
      setApplyingCoupon(false);
    }
  }

  function bookNow() {
    if (!cart || cart.selected.length === 0 || !agreedToTerms) return;
    if (customMessage.trim()) {
      sessionStorage.setItem(
        `repair-message:${brand.slug}:${device.slug}`,
        customMessage.trim()
      );
    }
    router.push(`/repair/${brand.slug}/${device.slug}/checkout`);
  }

  if (!cart) {
    return <div className="empty-note">Loading repair options...</div>;
  }

  return (
    <div className="repair-booking">
      <nav className="repair-breadcrumbs">
        <Link href="/repair">All brands</Link>
        <span>/</span>
        <Link href={`/repair/${brand.slug}`}>{brand.name}</Link>
        <span>/</span>
        <span>{device.name}</span>
      </nav>

      <div className="repair-promo-banner">
        <div className="repair-promo-banner__content">
          <div className="repair-promo-banner__title">Up to 50%* OFF on Mobile Repair</div>
          <div className="repair-promo-banner__code">Use Code <strong>{PROMO_CODE}</strong></div>
        </div>
        <button 
          type="button"
          className="repair-promo-banner__button"
          onClick={() => {
            setCouponInput(PROMO_CODE);
            if (couponInput !== PROMO_CODE) {
              applyCoupon();
            }
          }}
        >
          Apply Code
        </button>
      </div>

      <div className="repair-booking__layout">
        <div className="repair-booking__main">
          <div className="repair-device-hero">
            <img src={device.image} alt={device.name} />
            <div>
              <p className="repair-device-hero__brand">{brand.name}</p>
              <h1>{device.name}</h1>
            </div>
          </div>

          <h2 className="repair-section-title">Select repair services</h2>
          {services.length === 0 ? (
            <div className="empty-note">No repair services listed for this device yet.</div>
          ) : (
            <div className="repair-service-grid">
              {services.map((service) => {
                const selected = selectedIds.has(service._id);
                const lineTotal =
                  service.discountPrice != null ? service.discountPrice : service.price;
                return (
                  <article
                    key={service._id}
                    className={`repair-service-card${selected ? " repair-service-card--selected" : ""}`}
                  >
                    <img src={service.icon} alt="" className="repair-service-card__icon" />
                    <h3>{service.name}</h3>
                    <div className="repair-service-card__price">
                      {service.discountPrice != null &&
                        service.discountPrice < service.price && (
                          <span className="price-strike">{formatPrice(service.price)}</span>
                        )}
                      <strong>{formatPrice(lineTotal)}</strong>
                    </div>
                    {service.estimatedTime && (
                      <p className="repair-service-card__time">{service.estimatedTime}</p>
                    )}
                    <button
                      type="button"
                      className={`btn ${selected ? "btn--repair-remove" : "btn--repair"}`}
                      onClick={() => toggleService(service)}
                    >
                      {selected ? "Remove" : "Add +"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <div className="repair-custom-bar">
            <p>Looking for other repair service?</p>
            <textarea
              rows={2}
              placeholder="Leave a message — our team will get in touch with you."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          <div className="repair-faq">
            <h2 className="repair-section-title">Frequently Asked Questions</h2>
            {FAQS.map((faq, index) => (
              <div className="repair-faq__item" key={faq.q}>
                <button
                  type="button"
                  className="repair-faq__question"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  {faq.q}
                  <span>{openFaq === index ? "−" : "+"}</span>
                </button>
                {openFaq === index && <p className="repair-faq__answer">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>

        <RepairPriceSummary
          brandName={brand.name}
          deviceName={device.name}
          selected={cart.selected}
          subtotal={subtotal}
          couponCode={cart.couponCode}
          couponDiscount={cart.couponDiscount}
          couponInput={couponInput}
          onCouponInputChange={(value) => {
            setCouponInput(value);
            setCouponError("");
          }}
          onApplyCoupon={applyCoupon}
          applyingCoupon={applyingCoupon}
          couponError={couponError}
          total={total}
          savings={savings}
          agreedToTerms={agreedToTerms}
          onAgreedChange={setAgreedToTerms}
          actionLabel="Book Now"
          onAction={bookNow}
          actionDisabled={!agreedToTerms || cart.selected.length === 0}
        />
      </div>
    </div>
  );
}
