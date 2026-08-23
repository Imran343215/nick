/** Small shared helpers used across the app. */

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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