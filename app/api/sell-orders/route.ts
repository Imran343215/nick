import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import SellOrder from "@/models/SellOrder";
import SellVariant from "@/models/SellVariant";
import SellQuestion from "@/models/SellQuestion";
import { computeQuote } from "@/lib/sell-quote";
import { clean, generateTrackingId, validateEmail } from "@/lib/utils";
import { jsonWithCors, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

function orderNumber(): string {
  const random = [...crypto.getRandomValues(new Uint8Array(4))]
    .map((b) => b.toString(36).toUpperCase())
    .join("");
  return `SO-${random}`;
}

type OrderDocLike = {
  _id: unknown;
  orderNumber?: string;
  trackingId?: string;
  customerName?: string;
  customerEmail?: string;
  brandName?: string;
  deviceName?: string;
  variantLabel?: string;
  finalQuote?: number;
  status?: string;
  pickupDate?: Date | string | null;
  createdAt?: Date | string | null;
};

function serializeOrder(doc: OrderDocLike) {
  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber as string,
    trackingId: doc.trackingId as string,
    customerName: doc.customerName as string,
    customerEmail: doc.customerEmail as string,
    brandName: doc.brandName as string,
    deviceName: doc.deviceName as string,
    variantLabel: doc.variantLabel as string,
    finalQuote: doc.finalQuote as number,
    status: doc.status as string,
    pickupDate: doc.pickupDate ? new Date(doc.pickupDate).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

export async function OPTIONS() {
  return handleOptions();
}

/** POST /api/sell-orders — submit a "sell my phone" request. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Allow unauthenticated submissions (no Clerk auth required), same as repair-bookings.
    const { userId } = await auth().catch(() => ({ userId: null }));
    const user = userId ? await currentUser().catch(() => null) : null;

    const customerName = clean(body.customerName) || user?.fullName || "";
    const customerEmail =
      clean(body.customerEmail).toLowerCase() ||
      user?.primaryEmailAddress?.emailAddress?.toLowerCase() ||
      "";
    const customerPhone = clean(body.customerPhone);
    const brandName = clean(body.brandName);
    const deviceName = clean(body.deviceName);
    const brandSlug = clean(body.brandSlug);
    const deviceSlug = clean(body.deviceSlug);
    const deviceImage = clean(body.deviceImage);
    const variantId = clean(body.variantId);
    const addressLine = clean(body.addressLine);
    const addressCity = clean(body.addressCity);
    const addressPostcode = clean(body.addressPostcode);
    const pickupDateRaw = clean(body.pickupDate);
    const customMessage = clean(body.customMessage);
    const agreedToTerms = body.agreedToTerms === true;
    const payoutMethod = body.payoutMethod === "bank_transfer" ? "bank_transfer" : "upi";
    const payoutDetails = clean(body.payoutDetails);
    const answersInput: Array<{ questionId: string; optionLabel: string }> = Array.isArray(
      body.answers
    )
      ? body.answers
      : [];

    if (!customerName || !validateEmail(customerEmail) || !customerPhone) {
      return jsonWithCors(
        { ok: false, error: "Name, valid email, and phone are required." },
        { status: 400 }
      );
    }
    if (!brandName || !deviceName || !brandSlug || !deviceSlug || !variantId) {
      return jsonWithCors({ ok: false, error: "Device information is missing." }, { status: 400 });
    }
    if (!addressLine || !addressCity || !addressPostcode) {
      return jsonWithCors({ ok: false, error: "Complete pickup address is required." }, { status: 400 });
    }
    if (!pickupDateRaw) {
      return jsonWithCors({ ok: false, error: "Pickup date is required." }, { status: 400 });
    }
    if (!payoutDetails) {
      return jsonWithCors({ ok: false, error: "Payout details are required." }, { status: 400 });
    }
    if (!agreedToTerms) {
      return jsonWithCors({ ok: false, error: "You must agree to the terms." }, { status: 400 });
    }

    const pickupDate = new Date(pickupDateRaw);
    if (Number.isNaN(pickupDate.getTime())) {
      return jsonWithCors({ ok: false, error: "Invalid pickup date." }, { status: 400 });
    }

    await connectDB();

    // Never trust a price/quote sent from the client — re-fetch the variant's
    // base price and every answered question's option price adjustment from
    // the DB by ID and recompute the quote here.
    const variant = await SellVariant.findOne({ _id: variantId, status: "active" }).lean().exec();
    if (!variant) {
      return jsonWithCors({ ok: false, error: "Selected variant is not available." }, { status: 400 });
    }

    const questionIds = answersInput.map((a) => clean(a.questionId)).filter(Boolean);
    const questionDocs = questionIds.length
      ? await SellQuestion.find({ _id: { $in: questionIds }, status: "active" }).lean().exec()
      : [];
    const questionsById = new Map(questionDocs.map((q) => [String(q._id), q]));

    const resolvedAnswers = answersInput.map((a) => {
      const question = questionsById.get(clean(a.questionId));
      if (!question) {
        throw new Error("One of the submitted answers refers to an unknown question.");
      }
      const option = (question.options || []).find(
        (o: { label: string; priceAdjustment: number }) => o.label === clean(a.optionLabel)
      );
      if (!option) {
        throw new Error(`Invalid option selected for "${question.text}".`);
      }
      return {
        questionId: String(question._id),
        questionText: question.text as string,
        optionLabel: option.label as string,
        priceAdjustment: Number(option.priceAdjustment ?? 0),
      };
    });

    const finalQuote = computeQuote(Number(variant.basePrice), resolvedAnswers);

    const order = await SellOrder.create({
      orderNumber: orderNumber(),
      trackingId: generateTrackingId("SO"),
      clerkUserId: userId ?? undefined,
      customerName,
      customerEmail,
      customerPhone,
      brandName,
      deviceName,
      brandSlug,
      deviceSlug,
      deviceImage: deviceImage || undefined,
      variantLabel: variant.label,
      basePrice: Number(variant.basePrice),
      answers: resolvedAnswers,
      finalQuote,
      payoutMethod,
      payoutDetails,
      addressLine,
      addressCity,
      addressPostcode,
      pickupDate,
      customMessage: customMessage || undefined,
      status: "new",
      agreedToTerms,
    });

    return jsonWithCors({ ok: true, order: serializeOrder(order.toObject()) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit sell request.";
    console.error("[api POST /api/sell-orders]", err);
    return jsonWithCors({ ok: false, error: message }, { status: 400 });
  }
}
