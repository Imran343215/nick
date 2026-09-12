/** Pure quote math for the "Sell My Phone" flow. No DB/HTTP here so it can
 * run identically client-side (live preview while answering questions) and
 * server-side (authoritative recompute before an order is saved). */

export type QuoteAdjustment = { priceAdjustment: number };

/** Applies every answer's price adjustment to the variant's base price.
 * Never returns a negative quote. */
export function computeQuote(basePrice: number, answers: QuoteAdjustment[]): number {
  const raw = answers.reduce(
    (sum, a) => sum + (Number.isFinite(a.priceAdjustment) ? a.priceAdjustment : 0),
    Number.isFinite(basePrice) ? basePrice : 0
  );
  return Math.max(0, Math.round(raw));
}
