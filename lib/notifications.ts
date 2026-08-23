import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { formatPrice } from "@/lib/utils";

/**
 * New-order notifications (email + WhatsApp) sent to the shop admin after a
 * successful checkout. Everything is optional and driven from environment
 * variables so the site keeps working even when none are configured:
 *
 *   ADMIN_EMAIL                 → where the order email notification is sent
 *   ADMIN_WHATSAPP              → any phone (mobile or WhatsApp Business) that
 *                                 receives the order notification
 *
 *   Email (SMTP, via nodemailer):
 *     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 *   WhatsApp (Twilio Conversations / Messages API):
 *     TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 */

interface OrderLike {
  _id?: unknown;
  orderNumber?: string;
  productName?: string;
  total?: number;
  quantity?: number;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
}

/** Claim a one-time notification slot so concurrent webhooks/syncs don't double-send. */
async function claimNotification(orderId: unknown): Promise<boolean> {
  const claimed = await Order.updateOne(
    { _id: orderId, notifiedAt: { $eq: null } },
    { $set: { notifiedAt: new Date() } }
  ).exec();
  return claimed.modifiedCount > 0;
}

async function releaseNotification(orderId: unknown): Promise<void> {
  await Order.updateOne({ _id: orderId }, { $set: { notifiedAt: null } }).exec();
}

function emailConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.SMTP_HOST);
}

function whatsappConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_WHATSAPP &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

function orderSummary(order: OrderLike): string {
  return [
    `New order received 🛍️`,
    ``,
    `Order number: ${order.orderNumber ?? "—"}`,
    `Item: ${order.productName ?? "—"}`,
    `Quantity: ${order.quantity ?? 1}`,
    `Total: ${formatPrice(Number(order.total ?? 0))}`,
    `Customer: ${order.customerName ?? "—"} (${order.customerEmail ?? "—"})`,
    order.shippingAddress ? `Delivery: ${order.shippingAddress}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function sendAdminEmail(order: OrderLike): Promise<void> {
  if (!emailConfigured()) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@itechnick.local",
    to: process.env.ADMIN_EMAIL,
    subject: `New order ${order.orderNumber ?? ""} placed`,
    text: `${orderSummary(order)}\n\nLog in to the admin area to fulfil it.`,
  });
}

async function sendAdminWhatsApp(order: OrderLike): Promise<void> {
  if (!whatsappConfigured()) return;
  const target = process.env.ADMIN_WHATSAPP!.replace(/[^+\d]/g, "");
  const from = process.env.TWILIO_WHATSAPP_FROM!.replace(/[^+\d]/g, "");
  const body = `whatsapp:+${target}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`);
  const payload = new URLSearchParams({
    From: `whatsapp:+${from}`,
    To: body,
    Body: orderSummary(order),
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: payload.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio returned ${res.status}: ${detail.slice(0, 300)}`);
  }
}

/**
 * Send the admin an email + WhatsApp message for a newly paid order.
 * Safe to call from the Stripe webhook and/or the success-page sync route:
 * it only sends once per order and never throws (so a notification problem
 * cannot break checkout).
 */
export async function ensureOrderNotified(order: OrderLike): Promise<void> {
  if (!order?._id) return;
  if (!emailConfigured() && !whatsappConfigured()) {
    // Nothing is configured — nothing to send, and nothing to retry later.
    return;
  }
  try {
    await connectDB();
    if (!(await claimNotification(order._id))) return; // already notified

    try {
      await sendAdminEmail(order);
      await sendAdminWhatsApp(order);
    } catch (sendErr) {
      console.error("[notify] sending admin order notification failed:", sendErr);
      await releaseNotification(order._id); // allow a later retry
    }
  } catch (err) {
    console.error("[notify] ensureOrderNotified failed:", err);
  }
}