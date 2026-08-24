/** Small shared helpers used across the app. */

/* ---------- Client-side form validation ----------
   Each validator returns an error message, or "" when the value is fine.
   Forms collect them and show the first problem inline + as a toast. */

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Accepts UK local (07…) and international (+44…) formats with spaces/dashes. */
export function isPhone(value: string): boolean {
  return /^(\+?44|0)\d{9,10}$/.test(value.replace(/[\s\-().]/g, ""));
}

/** Full UK postcode, e.g. NW6 4TA / M15 4QX / EC1A 1BB. */
export function isUkPostcode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim());
}

export function requiredField(value: string, label: string): string {
  return value.trim() ? "" : `${label} is required.`;
}

export function validEmail(value: string, label = "Email"): string {
  return !value.trim() || isEmail(value) ? "" : `Enter a valid ${label.toLowerCase()}.`;
}

export function validPhone(value: string, label = "Phone"): string {
  return !value.trim() || isPhone(value)
    ? ""
    : `Enter a valid ${label.toLowerCase()} number (e.g. +44 7424 906280).`;
}

export function validUkPostcode(value: string, label = "Postcode"): string {
  return !value.trim() || isUkPostcode(value)
    ? ""
    : `Enter a full UK ${label.toLowerCase()} (e.g. NW6 4TA).`;
}

export function nonNegativeNumber(value: string, label: string): string {
  const n = Number(value);
  return value !== "" && Number.isFinite(n) && n >= 0
    ? ""
    : `${label} must be a number of 0 or more.`;
}

/** Returns the first actual error from a list of validator results. */
export function firstError(errors: Array<string | "" | undefined>): string {
  return errors.find(Boolean) ?? "";
}

export function generateTrackingId(prefix = "MRP"): string {
  const random = [...crypto.getRandomValues(new Uint8Array(6))]
    .map((b) => b.toString(36).toUpperCase())
    .join("");
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${stamp}-${random}`;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function validateEmail(email: string): boolean {
  return isEmail(email);
}

export function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function generateOrderNumber(): string {
  const random = [...crypto.getRandomValues(new Uint8Array(5))]
    .map((byte) => byte.toString(36).toUpperCase())
    .join("");
  return `IT-${random}`;
}

/* Common UK courier tracking URLs. Matches the courier name the admin typed
   (e.g. "Royal Mail", "DPD", "Hermes" / "Evri") and builds a direct tracking
   link from the tracking number so customers can follow the parcel. */
const COURIER_TRACKERS: { pattern: RegExp; url: (tracking: string) => string }[] = [
  {
    pattern: /royal[\s_-]?mail/i,
    url: (t) =>
      `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(t)}`,
  },
  {
    pattern: /dpd/i,
    url: (t) =>
      `https://www.dpd.co.uk/apps/tracking?reference=${encodeURIComponent(t)}`,
  },
  {
    pattern: /hermes|evri/i,
    url: (t) => `https://www.evri.com/track/parcel?trackingId=${encodeURIComponent(t)}`,
  },
  {
    pattern: /dhl/i,
    url: (t) =>
      `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${encodeURIComponent(t)}`,
  },
  {
    pattern: /ups/i,
    url: (t) => `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`,
  },
  {
    pattern: /fedex/i,
    url: (t) => `https://www.fedex.com/fedexlocker-gb/en/home?trknbr=${encodeURIComponent(t)}`,
  },
  {
    pattern: /parcel\s?force/i,
    url: (t) =>
      `https://www.parcelforce.com/track-parcels/${encodeURIComponent(t)}`,
  },
  {
    pattern: /yodel/i,
    url: (t) => `https://www.yodel.co.uk/tracking?parcel=${encodeURIComponent(t)}`,
  },
];

/** Returns the courier's tracking page URL, or null if the courier is
    unrecognised or there is no tracking number. */
export function courierTrackerUrl(
  courier: string | undefined,
  tracking: string | undefined
): string | null {
  if (!courier || !tracking) return null;
  for (const tracker of COURIER_TRACKERS) {
    if (tracker.pattern.test(courier)) return tracker.url(tracking);
  }
  return null;
}