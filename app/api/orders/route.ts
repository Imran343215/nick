import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { clean } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

function serialize(order: Record<string, any>) {
  return {
    orderNumber: order.orderNumber,
    productName: order.productName,
    quantity: order.quantity,
    total: order.total,
    currency: order.currency,
    customerName: order.customerName,
    shippingCarrier: order.shippingCarrier ?? "",
    shippingNumber: order.shippingNumber ?? "",
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "Please sign in to view orders." },
        { status: 401 }
      );
    const params = new URL(request.url).searchParams;
    const orderNumber = clean(params.get("orderNumber"));
    await connectDB();

    // Every order is linked to the signed-in Clerk account and returned,
    // newest first, so the user never has to hunt for an order number.
    const orders = await Order.find({ clerkUserId: userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const list = orders.map(serialize);

    if (orderNumber) {
      const order = list.find(
        (o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase()
      );
      if (!order)
        return NextResponse.json(
          { ok: false, error: "Order not found." },
          { status: 404 }
        );
      return NextResponse.json({ ok: true, order, orders: list });
    }

    return NextResponse.json({ ok: true, orders: list });
  } catch (err) {
    console.error("[api GET /api/orders]", err);
    return NextResponse.json(
      { ok: false, error: "Could not find orders." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret)
    return NextResponse.json(
      { ok: false, error: "Stripe is not configured." },
      { status: 503 }
    );
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "Please sign in to cancel orders." },
        { status: 401 }
      );
    const body = await request.json();
    const orderNumber = clean(body.orderNumber);
    if (!orderNumber)
      return NextResponse.json(
        { ok: false, error: "Order number is required." },
        { status: 400 }
      );
    await connectDB();
    const order = await Order.findOne({ orderNumber, clerkUserId: userId })
      .lean()
      .exec();
    if (!order)
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 }
      );
    if (!["pending", "processing"].includes(order.fulfillmentStatus))
      return NextResponse.json(
        { ok: false, error: "This order can no longer be cancelled." },
        { status: 409 }
      );

    if (order.paymentStatus === "paid" && order.stripePaymentIntentId) {
      await new Stripe(secret).refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    }
    const cancelled = await Order.findOneAndUpdate(
      { _id: order._id, fulfillmentStatus: { $in: ["pending", "processing"] } },
      {
        $set: {
          paymentStatus:
            order.paymentStatus === "paid" ? "failed" : order.paymentStatus,
          fulfillmentStatus: "cancelled",
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    if (cancelled)
      await Product.updateOne(
        { _id: order.productId },
        { $inc: { stock: order.quantity } }
      ).exec();
    return NextResponse.json({
      ok: true,
      order: cancelled ? serialize(cancelled) : undefined,
    });
  } catch (err) {
    console.error("[api POST /api/orders]", err);
    return NextResponse.json(
      { ok: false, error: "Could not cancel order." },
      { status: 500 }
    );
  }
}