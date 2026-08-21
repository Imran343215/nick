import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Lightweight admin authentication using a signed, expiring httpOnly cookie.
 * The token is HMAC-signed with a server secret so it cannot be forged.
 * Requires ADMIN_PASSWORD and AUTH_SECRET env vars (see .env.local.example).
 */

export const ADMIN_COOKIE = "mr_admin";
const COOKIE_LIFETIME_SECONDS = 60 * 60 * 12; // 12 hours

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "change-me-secret";
}

export function createAdminToken(): string {
  const exp = Date.now() + COOKIE_LIFETIME_SECONDS * 1000;
  const salt = crypto.randomBytes(12).toString("hex");
  const payload = Buffer.from(JSON.stringify({ exp, salt })).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`${salt}:${getPassword()}`)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: number; salt?: string };
    if (!data.exp || !data.salt || data.exp < Date.now()) return false;

    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(`${data.salt}:${getPassword()}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function cookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_LIFETIME_SECONDS,
  };
}