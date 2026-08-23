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
    <aside className="repair-summary">
      <div className="repair-summary__mode">
        Mode: <strong>{repairMode === "home" ? "Repair at Home" : "Repair at Store"}</strong>
      </div>
      <h2 className="repair-summary__title">Price Summary</h2>

      {selected.length === 0 ? (
        <p className="repair-summary__empty">Add repair services to see your summary.</p>
      ) : (
        <ol className="repair-summary__list">
          {selected.map((item, index) => (
            <li key={item.serviceId}>
              <span className="repair-summary__index">{index + 1}</span>
              <div className="repair-summary__line">
                <span className="repair-summary__item-name">
                  {brandName} {deviceName} {item.name.toUpperCase()}
                </span>
                <span className="repair-summary__item-price">
                  {item.discountPrice != null && item.discountPrice < item.price && (
                    <span className="price-strike">{formatPrice(item.price)}</span>
                  )}
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {showCoupon && (
        <div className="repair-summary__coupon">
          <label htmlFor="repair-coupon">Apply Coupon</label>
          <div className="repair-summary__coupon-row">
            <input
              id="repair-coupon"
              value={couponInput}
              onChange={(e) => onCouponInputChange(e.target.value)}
              placeholder="Enter code"
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
          {couponCode && couponDiscount > 0 && (
            <p className="repair-summary__coupon-applied">
              {couponCode} applied (−{formatPrice(couponDiscount)})
            </p>
          )}
          {couponError && <p className="repair-summary__coupon-error">{couponError}</p>}
        </div>
      )}

      <dl className="repair-summary__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {couponDiscount > 0 && (
          <div className="repair-summary__discount-row">
            <dt>Coupon discount</dt>
            <dd>−{formatPrice(couponDiscount)}</dd>
          </div>
        )}
        <div className="repair-summary__total-row">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>

      {savings > 0 && (
        <div className="repair-summary__saved">You have saved {formatPrice(savings)}</div>
      )}

      {showTerms && (
        <label className="repair-summary__terms check-label">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => onAgreedChange(e.target.checked)}
          />
          I agree to the Terms and Conditions
        </label>
      )}

      <button
        type="button"
        className="btn btn--repair btn--repair-full"
        disabled={actionDisabled || selected.length === 0}
        onClick={onAction}
      >
        {actionLabel}
      </button>

      <div className="repair-summary__trust">
        <div>
          <strong>46K+</strong>
          <span>Devices Repaired</span>
        </div>
        <div>
          <strong>4.3+</strong>
          <span>Rated Service</span>
        </div>
      </div>
    </aside>
  );
}
