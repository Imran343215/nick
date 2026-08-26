/** Server-side invoice helpers.
 *
 *  Invoices are issued the moment an order is delivered (fulfilment status
 *  "completed") — like a real e-commerce back office. Each invoice gets a
 *  sequential per-year number (INV-2026-00001…) and is rendered to a proper
 *  PDF with pdf-lib, so customers and admins download the same document.
 *
 *  Server-only: pulls in Mongoose + pdf-lib. Never import from client code.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Order from "@/models/Order";

type OrderRecord = Record<string, any> & { _id: unknown; orderNumber: string };

/**
 * Allocates the next sequential invoice number for the year and stamps it
 * onto the order together with the issue date. Safe against double-issuing:
 * the update only applies while the order is still invoice-less, and unique
 * index collisions are retried with the next number.
 */
export async function ensureInvoiceIssued(order: OrderRecord) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const issuedThisYear = await Order.countDocuments({
      invoiceNumber: { $regex: `^${prefix}` },
    }).exec();
    const candidate = `${prefix}${String(issuedThisYear + 1).padStart(5, "0")}`;

    try {
      const stamped = await Order.findOneAndUpdate(
        { _id: order._id, invoiceNumber: { $exists: false } },
        { $set: { invoiceNumber: candidate, invoicedAt: new Date() } },
        { new: true }
      )
        .lean()
        .exec();
      if (stamped) return stamped;
      // Another request won the race — return the freshly stamped order.
      const fresh = await Order.findById(order._id).lean().exec();
      if (!fresh) throw new Error("Order disappeared while issuing its invoice.");
      return fresh;
    } catch (err) {
      // Duplicate key on invoiceNumber → an invoice was created in parallel;
      // take the next number and try again.
      if ((err as { code?: number })?.code === 11000) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate an invoice number.");
}

/* ------------------------------------------------------------------ */
/* PDF rendering                                                       */
/* ------------------------------------------------------------------ */

const BRAND_NAME = "iTECHNICK LTD";
const BRAND_TAGLINE = "Phones · Tablets · Repairs · Accessories";

/** Builds the downloadable A4 invoice PDF for an order. */
export async function buildInvoicePdf(order: OrderRecord): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${order.invoiceNumber ?? order.orderNumber} — ${BRAND_NAME}`);
  doc.setAuthor(BRAND_NAME);
  doc.setSubject(`Invoice for order ${order.orderNumber}`);
  doc.setCreator(BRAND_NAME);

  const W = 595.28; // A4 portrait
  const H = 841.89;
  const M = 46; // page margin
  const page = doc.addPage([W, H]);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const INK = rgb(0.13, 0.15, 0.21);
  const MUTED = rgb(0.44, 0.47, 0.54);
  const DARK = rgb(0.05, 0.08, 0.14);
  const LIGHT = rgb(0.76, 0.79, 0.85);
  const WHITE = rgb(1, 1, 1);
  const SOFT = rgb(0.93, 0.94, 0.96);
  const LINE = rgb(0.84, 0.86, 0.89);
  const AMBER = rgb(0.96, 0.66, 0.19);

  const money = (value: number) =>
    `£${Number(value || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtDate = (value?: Date | string | null) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const wrap = (text: string, size: number, maxWidth: number, font = regular) => {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };

  /** Right-aligned text helper. */
  const right = (
    text: string,
    size: number,
    font = regular,
    color = INK,
    y: number
  ) => {
    page.drawText(text, {
      x: W - M - font.widthOfTextAtSize(text, size),
      y,
      size,
      font,
      color,
    });
  };

  // __PART2__
  /* ---- Header band ---- */
  const BAND_H = 118;
  page.drawRectangle({ x: 0, y: H - BAND_H, width: W, height: BAND_H, color: DARK });
  page.drawRectangle({ x: 0, y: H - BAND_H - 3, width: W, height: 3, color: AMBER });

  page.drawText("iTECHNICK", { x: M, y: H - 56, size: 24, font: bold, color: WHITE });
  page.drawText(BRAND_TAGLINE, {
    x: M,
    y: H - 74,
    size: 9.5,
    font: regular,
    color: LIGHT,
  });

  right("INVOICE", 22, bold, WHITE, H - 46);
  right(String(order.invoiceNumber ?? ""), 10, regular, AMBER, H - 62);
  right(`Issued ${fmtDate(order.invoicedAt)}`, 9, regular, LIGHT, H - 77);

  /* ---- Meta columns ---- */
  const metaY = H - BAND_H - 38;
  const colGap = 18;
  const colW = (W - M * 2 - colGap * 2) / 3;

  const heading = (text: string, x: number) =>
    page.drawText(text.toUpperCase(), { x, y: metaY, size: 8, font: bold, color: MUTED });

  // Column 1 — billed to
  heading("Billed to", M);
  let yy = metaY - 16;
  for (const line of wrap(order.customerName, 11, colW, bold)) {
    page.drawText(line, { x: M, y: yy, size: 11, font: bold, color: INK });
    yy -= 14;
  }
  for (const line of wrap(order.customerEmail, 9, colW)) {
    page.drawText(line, { x: M, y: yy, size: 9, font: regular, color: MUTED });
    yy -= 12;
  }

  // Column 2 — deliver to
  const c2 = M + colW + colGap;
  heading("Deliver to", c2);
  yy = metaY - 16;
  const address = String(order.shippingAddress || "").trim() || "As agreed with the store";
  const addressLines = wrap(address.replace(/\s*\r?\n\s*/g, ", "), 9.5, colW).slice(0, 6);
  for (const line of addressLines) {
    page.drawText(line, { x: c2, y: yy, size: 9.5, font: regular, color: INK });
    yy -= 12;
  }

  // Column 3 — key details
  const c3 = M + (colW + colGap) * 2;
  heading("Details", c3);
  yy = metaY - 15;
  const detail = (key: string, value: string) => {
    page.drawText(key, { x: c3, y: yy, size: 9, font: regular, color: MUTED });
    right(value, 9, bold, INK, yy);
    yy -= 13.5;
  };
  detail("Order", String(order.orderNumber));
  detail("Ordered", fmtDate(order.createdAt));
  detail("Delivered", fmtDate(order.invoicedAt));
  detail("Method", "Card · Stripe");
  detail("Status", String(order.paymentStatus || "unknown").toUpperCase());

  // __PART3__
  /* ---- Items table ---- */
  const tableY = 552;
  const qtyR = 396;
  const unitR = 474;
  const amtR = W - M;

  page.drawRectangle({ x: M, y: tableY, width: W - M * 2, height: 22, color: SOFT });
  const th = (text: string, rightEdge?: number, x?: number) => {
    const tx =
      rightEdge !== undefined ? rightEdge - bold.widthOfTextAtSize(text, 8) : x ?? M;
    page.drawText(text, { x: tx, y: tableY + 7, size: 8, font: bold, color: MUTED });
  };
  th("DESCRIPTION", undefined, M + 10);
  th("QTY", qtyR);
  th("UNIT PRICE", unitR);
  th("AMOUNT", amtR);

  const rowY = tableY - 26;
  let ry = rowY;
  for (const line of wrap(String(order.productName), 10, qtyR - M - 34)) {
    page.drawText(line, { x: M + 10, y: ry, size: 10, font: regular, color: INK });
    ry -= 14;
  }
  const rowValue = (text: string, rightTo: number, strong = false) =>
    right(text, 10, strong ? bold : regular, INK, rowY);
  rowValue(String(order.quantity), qtyR);
  rowValue(money(Number(order.unitPrice)), unitR);
  rowValue(money(Number(order.unitPrice) * Number(order.quantity)), amtR, true);

  const rowBottom = Math.min(ry, rowY - 12) + 4;
  page.drawLine({
    start: { x: M, y: rowBottom },
    end: { x: W - M, y: rowBottom },
    thickness: 0.75,
    color: LINE,
  });

  /* ---- Totals ---- */
  let ty = rowBottom - 26;
  const totalRow = (label: string, value: string, strong = false) => {
    page.drawText(label, {
      x: unitR - 96,
      y: ty,
      size: strong ? 11 : 9.5,
      font: strong ? bold : regular,
      color: strong ? INK : MUTED,
    });
    right(value, strong ? 12 : 10, bold, INK, ty);
  };
  totalRow("Subtotal", money(Number(order.unitPrice) * Number(order.quantity)));
  ty -= 17;
  totalRow("Delivery", "Free");
  ty -= 12;
  page.drawLine({
    start: { x: unitR - 96, y: ty },
    end: { x: amtR, y: ty },
    thickness: 0.75,
    color: LINE,
  });
  ty -= 24;
  totalRow("Total paid", money(Number(order.total)), true);
  page.drawRectangle({
    x: unitR - 96,
    y: ty - 6,
    width: amtR - (unitR - 96),
    height: 1.5,
    color: AMBER,
  });

  /* ---- Payment / policy note ---- */
  const noteBoxY = ty - 64;
  page.drawRectangle({ x: M, y: noteBoxY, width: W - M * 2, height: 36, color: SOFT });
  const paid = order.paymentStatus === "paid";
  page.drawText(
    paid
      ? "Paid in full — processed securely by Stripe."
      : "Payment pending — this document summarises your order.",
    {
      x: M + 12,
      y: noteBoxY + 21,
      size: 9,
      font: bold,
      color: paid ? rgb(0.1, 0.5, 0.29) : MUTED,
    }
  );
  page.drawText(
    "Cancelled orders are refunded automatically to the original payment card.",
    { x: M + 12, y: noteBoxY + 8, size: 8, font: regular, color: MUTED }
  );

  // __PART4__
  /* ---- Footer ---- */
  page.drawLine({
    start: { x: M, y: 92 },
    end: { x: W - M, y: 92 },
    thickness: 0.75,
    color: LINE,
  });
  page.drawText("Thank you for shopping with iTECHNICK.", {
    x: M,
    y: 74,
    size: 9.5,
    font: bold,
    color: INK,
  });
  page.drawText(
    "This invoice was generated electronically and is valid without a signature.",
    { x: M, y: 60, size: 8, font: regular, color: MUTED }
  );
  page.drawText(`${BRAND_NAME} · United Kingdom · All amounts in GBP`, {
    x: M,
    y: 46,
    size: 8,
    font: regular,
    color: MUTED,
  });
  right(
    `${order.invoiceNumber ?? "DRAFT"} · ${order.orderNumber}`,
    8,
    regular,
    MUTED,
    46
  );

  return doc.save();
}
