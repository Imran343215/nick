import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { clean, generateOrderNumber, validateEmail } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please sign in before buying." }, { status: 401 });
    }
    const user = await currentUser();
    const customerEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!user || !customerEmail) {
      return NextResponse.json({ ok: false, error: "Your account needs a verified email before buying." }, { status: 400 });
    }

    const body = await request.json();
    const productId = clean(body.productId);
    const customerName = user.fullName || user.firstName || customerEmail.split("@")[0];
    const shippingAddress = clean(body.shippingAddress);
    if (!productId || !customerName || !validateEmail(customerEmail)) {
      return NextResponse.json({ ok: false, error: "Name, valid email, and product are required." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findOneAndUpdate(
      { _id: productId, active: true, stock: { $gte: 1 } },
      { $inc: { stock: -1 } },
      { new: true }
    ).lean().exec();
    if (!product) {
      return NextResponse.json({ ok: false, error: "This product is out of stock." }, { status: 409 });
    }

    const orderNumber = generateOrderNumber();
    const stripe = new Stripe(secret);
    const origin = new URL(request.url).origin;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        line_items: [{
          price_data: {
            currency: "gbp",
            product_data: { name: product.name, images: product.imageUrl ? [product.imageUrl] : undefined },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          clerkUserId: userId,
          orderNumber,
          productId: String(product._id),
          productName: product.name,
          unitPrice: String(product.price),
          customerName,
          customerEmail,
          shippingAddress,
        },
        success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}&order_number=${encodeURIComponent(orderNumber)}`,
        cancel_url: `${origin}/store/${product.slug}/order?cancelled=1`,
      });
      await Order.create({
        orderNumber,
        clerkUserId: userId,
        productId: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        currency: "gbp",
        customerName,
        customerEmail,
        shippingAddress,
        stripeSessionId: session.id,
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
      });
      return NextResponse.json({ ok: true, url: session.url });
    } catch (err) {
      await Product.updateOne({ _id: product._id }, { $inc: { stock: 1 } }).exec();
      throw err;
    }
  } catch (err) {
    console.error("[api POST /api/checkout]", err);
    return NextResponse.json({ ok: false, error: "Could not start checkout." }, { status: 500 });
  }
}