import type { RepairServiceShape } from "@/lib/repair-catalog";

export type CartService = {
  serviceId: string;
  name: string;
  price: number;
  discountPrice?: number;
  lineTotal: number;
};

export type RepairCart = {
  brandSlug: string;
  brandName: string;
  deviceSlug: string;
  deviceName: string;
  deviceImage: string;
  selected: CartService[];
  couponCode?: string;
  couponDiscount: number;
};

export function serviceLineTotal(service: RepairServiceShape): number {
  return service.discountPrice != null ? service.discountPrice : service.price;
}

export function cartSubtotal(selected: CartService[]): number {
  return selected.reduce((sum, item) => sum + item.lineTotal, 0);
}

export function cartOriginalTotal(selected: CartService[]): number {
  return selected.reduce((sum, item) => sum + item.price, 0);
}

export function cartSavings(selected: CartService[], couponDiscount = 0): number {
  const itemSavings = selected.reduce(
    (sum, item) => sum + Math.max(0, item.price - item.lineTotal),
    0
  );
  return itemSavings + couponDiscount;
}

export function cartTotal(subtotal: number, couponDiscount = 0): number {
  return Math.max(0, subtotal - couponDiscount);
}

export function cartStorageKey(brandSlug: string, deviceSlug: string): string {
  return `repair-cart:${brandSlug}:${deviceSlug}`;
}

export function loadCart(brandSlug: string, deviceSlug: string): RepairCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cartStorageKey(brandSlug, deviceSlug));
    return raw ? (JSON.parse(raw) as RepairCart) : null;
  } catch {
    return null;
  }
}

export function saveCart(cart: RepairCart): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    cartStorageKey(cart.brandSlug, cart.deviceSlug),
    JSON.stringify(cart)
  );
}

export function clearCart(brandSlug: string, deviceSlug: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(cartStorageKey(brandSlug, deviceSlug));
}

export function toggleServiceInCart(
  cart: RepairCart,
  service: RepairServiceShape,
  add: boolean
): RepairCart {
  if (add) {
    if (cart.selected.some((s) => s.serviceId === service._id)) return cart;
    const next: CartService = {
      serviceId: service._id,
      name: service.name,
      price: service.price,
      discountPrice: service.discountPrice,
      lineTotal: serviceLineTotal(service),
    };
    return { ...cart, selected: [...cart.selected, next] };
  }
  return {
    ...cart,
    selected: cart.selected.filter((s) => s.serviceId !== service._id),
  };
}
