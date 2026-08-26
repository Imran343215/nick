import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import Order from "@/models/Order";
import { buildInvoicePdf, ensureInvoiceIssued } from "@/lib/invoice";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderNumber: string }> };

/**
 * GET /api/invoices/:orderNumber — download the order's PDF invoice.
 *
 * Real e-commerce rule: an invoice exists once the order has been delivered
 * (fulfilment "completed"). Admins and the ordering customer can download it;
 * orders completed before invoices existed get one issued on demand.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { orderNumber } = await params;
    const requested = decodeURIComponent(orderNumber).trim();

    const admin = await isAdminAuthed();
    if (!admin) {
      const { userId } = await auth();
      if (!userId)
        return NextResponse.json(
          { ok: false, error: "Please sign in to view your invoices." },
          { status: 401 }
        );
    }

    await connectDB();
    let order = await Order.findOne({ orderNumber: requested }).lean().exec();
    if (!order)
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

    if (!admin && order.clerkUserId !== (await auth()).userId)
      return NextResponse.json(
        { ok: false, error: "You do not have access to this invoice." },
        { status: 403 }
      );

    if (order.fulfillmentStatus === "cancelled")
      return NextResponse.json(
        { ok: false, error: "Cancelled orders do not have an invoice." },
        { status: 409 }
      );

    if (order.fulfillmentStatus !== "completed")
      return NextResponse.json(
        { ok: false, error: "Your invoice becomes available once your order is delivered." },
        { status: 409 }
      );

    // Legacy orders delivered before invoicing existed: issue theirs now.
    if (!order.invoiceNumber || !order.invoicedAt) {
      order = await ensureInvoiceIssued(order);
    }

    const pdfBytes = await buildInvoicePdf(order);
    const filename = `${order.invoiceNumber}-${order.orderNumber}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api GET /api/invoices/:orderNumber]", err);
    return NextResponse.json(
      { ok: false, error: "Could not generate the invoice." },
      { status: 500 }
    );
  }
}
