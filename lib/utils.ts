/** Small shared helpers used across the app. */

export function generateTrackingId(prefix = "MRP"): string {
  const random = [...crypto.getRandomValues(new Uint8Array(6))]
    .map((b) => b.toString(36).toUpperCase())
    .join("");
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${stamp}-${random}`;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}