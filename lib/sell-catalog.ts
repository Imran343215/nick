import { connectDB } from "@/lib/db";
import SellVariant from "@/models/SellVariant";
import SellQuestion from "@/models/SellQuestion";

export type SellVariantShape = {
  _id: string;
  device: string;
  deviceName?: string;
  deviceSlug?: string;
  brandName?: string;
  brandSlug?: string;
  label: string;
  slug: string;
  basePrice: number;
  status: "active" | "inactive";
  order: number;
};

export type SellQuestionOptionShape = {
  label: string;
  adjustmentType: "flat" | "percent";
  direction: "reduce" | "increase";
  value: number;
};

export type SellQuestionShape = {
  _id: string;
  text: string;
  slug: string;
  options: SellQuestionOptionShape[];
  status: "active" | "inactive";
  order: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any>;

export function serializeSellVariant(doc: Doc, device?: Doc | null): SellVariantShape {
  const deviceDoc = device ?? (doc.device as Record<string, unknown> | null);
  const brandDoc = deviceDoc?.brand as Record<string, unknown> | undefined;
  return {
    _id: String(doc._id),
    device: deviceDoc ? String(deviceDoc._id ?? doc.device) : String(doc.device),
    deviceName: deviceDoc ? (deviceDoc.name as string) : undefined,
    deviceSlug: deviceDoc ? (deviceDoc.slug as string) : undefined,
    brandName: brandDoc ? (brandDoc.name as string) : undefined,
    brandSlug: brandDoc ? (brandDoc.slug as string) : undefined,
    label: doc.label as string,
    slug: doc.slug as string,
    basePrice: Number(doc.basePrice),
    status: doc.status as SellVariantShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export function serializeSellQuestion(doc: Doc): SellQuestionShape {
  return {
    _id: String(doc._id),
    text: doc.text as string,
    slug: doc.slug as string,
    options: ((doc.options as Doc[]) || []).map((o) => ({
      label: o.label as string,
      adjustmentType: (o.adjustmentType === "percent" ? "percent" : "flat") as "flat" | "percent",
      // Questions created before "direction" existed default to "reduce" —
      // the overwhelmingly common case, and what a bare positive number
      // (e.g. "5%" for a scratch) was always meant to do.
      direction: (o.direction === "increase" ? "increase" : "reduce") as "reduce" | "increase",
      value: Number(o.value ?? 0),
    })),
    status: doc.status as SellQuestionShape["status"],
    order: Number(doc.order ?? 0),
  };
}

export async function fetchActiveVariantsForDevice(
  deviceId: string
): Promise<SellVariantShape[]> {
  try {
    await connectDB();
    const docs = await SellVariant.find({ device: deviceId, status: "active" })
      .sort({ order: 1, label: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeSellVariant(doc));
  } catch (err) {
    console.error("[sell-catalog] could not load variants:", err);
    return [];
  }
}

export async function fetchActiveQuestions(): Promise<SellQuestionShape[]> {
  try {
    await connectDB();
    const docs = await SellQuestion.find({ status: "active" })
      .sort({ order: 1, text: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeSellQuestion(doc));
  } catch (err) {
    console.error("[sell-catalog] could not load questions:", err);
    return [];
  }
}
