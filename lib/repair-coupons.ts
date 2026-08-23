import { connectDB } from "@/lib/db";
import RepairCoupon from "@/models/RepairCoupon";

export type CouponValidation = {
  ok: boolean;
  code?: string;
  discount?: number;
  error?: string;
};

export async function validateRepairCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter a coupon code." };

  await connectDB();
  const coupon = await RepairCoupon.findOne({ code: normalized, status: "active" })
    .lean()
    .exec();
  if (!coupon) return { ok: false, error: "Invalid or expired coupon." };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      error: `Minimum order of £${coupon.minSubtotal.toFixed(2)} required for this coupon.`,
    };
  }

  let discount =
    coupon.discountType === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  return { ok: true, code: normalized, discount: Math.round(discount * 100) / 100 };
}
