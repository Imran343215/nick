import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return new NextResponse("Stripe is not configured.", { status: 503 });

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new NextResponse("Missing Stripe signature.", { status: 400 });
    const stripe = new Stripe(secret);
    const event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};
      await connectDB();
      await Order.updateOne(
        { stripeSessionId: session.id },
        {
          $set: {
            paymentStatus: "paid",
            clerkUserId: metadata.clerkUserId,
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          },
          $setOnInsert: {
            clerkUserId: metadata.clerkUserId,
            productId: metadata.productId,
            productName: metadata.productName ?? "Product",
            quantity: 1,
            unitPrice: Number(metadata.unitPrice ?? 0),
            total: Number(metadata.unitPrice ?? 0),
            currency: "gbp",
            customerName: metadata.customerName ?? "Customer",
            customerEmail: metadata.customerEmail ?? session.customer_email ?? "",
            shippingAddress: metadata.shippingAddress ?? "",
            stripeSessionId: session.id,
            fulfillmentStatus: "pending",
          },
        },
        { upsert: true }
      ).exec();
    }
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await connectDB();
      const cancelled = await Order.findOneAndUpdate(
        { stripeSessionId: session.id, paymentStatus: "pending", fulfillmentStatus: "pending" },
        { $set: { paymentStatus: "failed", fulfillmentStatus: "cancelled" } },
        { new: true }
      ).lean().exec();
      if (cancelled) await Product.updateOne({ _id: cancelled.productId }, { $inc: { stock: cancelled.quantity } }).exec();
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[api POST /api/stripe/webhook]", err);
    return new NextResponse("Webhook error.", { status: 400 });
  }
}