/** Pure quote math for the "Sell My Phone" flow. No DB/HTTP here so it can
 * run identically client-side (live preview while answering questions) and
 * server-side (authoritative recompute before an order is saved).
 *
 * Each variant has a max price (best possible condition). Every condition
 * question option then EITHER reduces OR increases that price — the admin
 * picks the direction explicitly and enters a plain positive magnitude, so
 * "minor scratch: reduce by 5%" always reduces, regardless of how the
 * number is typed in. */

export type AdjustmentType = "flat" | "percent";
export type AdjustmentDirection = "reduce" | "increase";

export type QuoteAdjustment = {
  adjustmentType: AdjustmentType;
  direction: AdjustmentDirection;
  /** Magnitude — sign is ignored, direction alone decides +/-. */
  value: number;
};

/** Resolves one option's adjustment into a signed currency amount, relative
 * to the variant's max price. Percent adjustments are always a percentage of
 * the max price (not of any already-adjusted running total), so the order in
 * which questions are answered never changes the result. */
export function resolveAdjustment(maxPrice: number, adjustment: QuoteAdjustment): number {
  const base = Number.isFinite(maxPrice) ? maxPrice : 0;
  const magnitude = Math.abs(Number.isFinite(adjustment.value) ? adjustment.value : 0);
  const signed = adjustment.direction === "increase" ? magnitude : -magnitude;
  if (adjustment.adjustmentType === "percent") {
    return Math.round((base * signed) / 100);
  }
  return Math.round(signed);
}

/** Applies every answer's resolved adjustment to the variant's max price.
 * Never returns a negative quote. */
export function computeQuote(maxPrice: number, answers: QuoteAdjustment[]): number {
  const base = Number.isFinite(maxPrice) ? maxPrice : 0;
  const total = answers.reduce((sum, a) => sum + resolveAdjustment(base, a), base);
  return Math.max(0, Math.round(total));
}
