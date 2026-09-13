import { computeQuote } from "@/lib/sell-quote";

export type SellCartAnswer = {
  questionId: string;
  questionText: string;
  optionLabel: string;
  adjustmentType: "flat" | "percent";
  direction: "reduce" | "increase";
  value: number;
};

export type SellCart = {
  brandSlug: string;
  brandName: string;
  deviceSlug: string;
  deviceName: string;
  deviceImage: string;
  variantId: string;
  variantLabel: string;
  basePrice: number;
  answers: SellCartAnswer[];
};

export function sellCartQuote(cart: SellCart): number {
  return computeQuote(cart.basePrice, cart.answers);
}

export function sellCartStorageKey(brandSlug: string, deviceSlug: string): string {
  return `sell-cart:${brandSlug}:${deviceSlug}`;
}

export function loadSellCart(brandSlug: string, deviceSlug: string): SellCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sellCartStorageKey(brandSlug, deviceSlug));
    return raw ? (JSON.parse(raw) as SellCart) : null;
  } catch {
    return null;
  }
}

export function saveSellCart(cart: SellCart): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(sellCartStorageKey(cart.brandSlug, cart.deviceSlug), JSON.stringify(cart));
}

export function clearSellCart(brandSlug: string, deviceSlug: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(sellCartStorageKey(brandSlug, deviceSlug));
}

export function setAnswerInCart(
  cart: SellCart,
  answer: SellCartAnswer
): SellCart {
  const withoutQuestion = cart.answers.filter((a) => a.questionId !== answer.questionId);
  return { ...cart, answers: [...withoutQuestion, answer] };
}
