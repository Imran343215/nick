"use client";

import { formatPrice } from "@/lib/utils";
import type { CartService } from "@/lib/repair-cart";

type Props = {
  brandName: string;
  deviceName: string;
  selected: CartService[];
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  applyingCoupon?: boolean;
  couponError?: string;
  total: number;
  savings: number;
  agreedToTerms: boolean;
  onAgreedChange: (value: boolean) => void;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
  showCoupon?: boolean;
  showTerms?: boolean;
  repairMode?: "home" | "store";
};

export default function RepairPriceSummary({
  brandName,
  deviceName,
  selected,
  subtotal,
  couponCode,
  couponDiscount,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  applyingCoupon,
  couponError,
  total,
  savings,
  agreedToTerms,
  onAgreedChange,
  actionLabel,
  onAction,
  actionDisabled,
  showCoupon = true,
  showTerms = true,
  repairMode = "home",
}: Props) {
  return (
    <aside className="repair-price-summary">
      <div className="repair-price-summary__mode">
        Mode: {repairMode === "home" ? "Repair at Home" : "Repair at Store"}
      </div>
      <h2>Price Summary</h2>

      {selected.length === 0 ? (
        <p className="empty-note">Add repair services to see your summary.</p>
      ) : (
        <div className="repair-price-summary__items">
          {selected.map((item) => (
            <div key={item.serviceId} className="repair-price-summary__item">
              <span className="repair-price-summary__item-name">
                {brandName} {deviceName} {item.name.toUpperCase()}
              </span>
              <span className="repair-price-summary__item-price">
                {item.discountPrice != null && item.discountPrice < item.price && (
                  <span className="price-strike">{formatPrice(item.price)}</span>
                )}
                {formatPrice(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      )}

      {couponDiscount > 0 && (
        <div className="repair-price-summary__discount">
          <span className="repair-price-summary__discount-label">Discount</span>
          <span className="repair-price-summary__discount-value">−{formatPrice(couponDiscount)}</span>
        </div>
      )}

      <div className="repair-price-summary__total">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      {savings > 0 && (
        <div className="repair-price-summary__savings">
          You have saved {formatPrice(savings)}
        </div>
      )}

      {showCoupon && (
        <div className="repair-price-summary__coupon">
          <div className="repair-price-summary__coupon-input">
            <input
              value={couponInput}
              onChange={(e) => onCouponInputChange(e.target.value)}
              placeholder="Apply Coupons"
            />
            <button
              type="button"
              className="btn btn--repair-outline"
              onClick={onApplyCoupon}
              disabled={applyingCoupon || !couponInput.trim()}
            >
              {applyingCoupon ? "..." : "Apply"}
            </button>
          </div>
          {couponError && <p className="repair-price-summary__coupon-error">{couponError}</p>}
        </div>
      )}

      <div className="repair-price-summary__stats">
        <div className="repair-price-summary__stat">
          <strong>46K+</strong> Device Repaired
        </div>
        <div className="repair-price-summary__stat">
          <strong>4.3+</strong> Rated Products
        </div>
      </div>

      <div className="repair-price-summary__safe">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Your payment is 100% safe with us
      </div>

      {showTerms && (
        <label className="repair-price-summary__terms">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => onAgreedChange(e.target.checked)}
          />
          I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
        </label>
      )}

      <button
        type="button"
        className="btn btn--repair"
        disabled={actionDisabled}
        onClick={onAction}
        style={{ width: "100%" }}
      >
        {actionLabel}
      </button>
    </aside>
  );
}
