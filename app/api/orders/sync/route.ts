import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { ensureOrderNotified } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Please sign in to view this order." }, { status: 401 });
    const body = await request.json() as { sessionId?: unknown };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ ok: false, error: "Invalid checkout session." }, { status: 400 });
    }

    const stripeSession = await new Stripe(secret).checkout.sessions.retrieve(sessionId);
    await connectDB();
    const order = await Order.findOne({ stripeSessionId: sessionId, clerkUserId: userId }).exec();
    if (!order) return NextResponse.json({ ok: false, error: "Order not found for this account." }, { status: 404 });

    if (stripeSession.payment_status === "paid" && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      if (typeof stripeSession.payment_intent === "string") order.stripePaymentIntentId = stripeSession.payment_intent;
      await order.save();
      await ensureOrderNotified(order.toObject());
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus });
  } catch (err) {
    console.error("[api POST /api/orders/sync]", err);
    return NextResponse.json({ ok: false, error: "Could not verify payment." }, { status: 500 });
  }
}