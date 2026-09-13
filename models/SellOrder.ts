import mongoose, { Schema, model, models } from "mongoose";

export type SellOrderStatus =
  | "new"
  | "pickup_scheduled"
  | "picked_up"
  | "inspected"
  | "paid"
  | "rejected";

export interface ISellOrderAnswer {
  questionId: string;
  questionText: string;
  optionLabel: string;
  /** How this option's deduction/bonus was specified at the time of order. */
  adjustmentType: "flat" | "percent";
  direction: "reduce" | "increase";
  value: number;
  /** The actual currency amount this resolved to against the order's max price
   * (already computed — percent options don't need the max price to display). */
  priceAdjustment: number;
}

export interface ISellOrder {
  orderNumber: string;
  trackingId: string;
  clerkUserId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  brandName: string;
  deviceName: string;
  brandSlug: string;
  deviceSlug: string;
  deviceImage?: string;
  variantLabel: string;
  /** The variant's max price (best condition), before any question deductions. */
  basePrice: number;
  answers: ISellOrderAnswer[];
  finalQuote: number;
  payoutMethod: "upi" | "bank_transfer";
  payoutDetails: string;
  addressLine: string;
  addressCity: string;
  addressPostcode: string;
  pickupDate: Date;
  customMessage?: string;
  status: SellOrderStatus;
  agreedToTerms: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SellOrderAnswerSchema = new Schema<ISellOrderAnswer>(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    optionLabel: { type: String, required: true },
    adjustmentType: { type: String, enum: ["flat", "percent"], required: true, default: "flat" },
    direction: { type: String, enum: ["reduce", "increase"], required: true, default: "reduce" },
    value: { type: Number, required: true, default: 0 },
    priceAdjustment: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const SellOrderSchema = new Schema<ISellOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    trackingId: { type: String, required: true, unique: true, index: true },
    clerkUserId: { type: String, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    deviceName: { type: String, required: true, trim: true },
    brandSlug: { type: String, required: true, trim: true },
    deviceSlug: { type: String, required: true, trim: true },
    deviceImage: { type: String, trim: true },
    variantLabel: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    answers: { type: [SellOrderAnswerSchema], required: true },
    finalQuote: { type: Number, required: true, min: 0 },
    payoutMethod: { type: String, enum: ["upi", "bank_transfer"], required: true },
    payoutDetails: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    addressCity: { type: String, required: true, trim: true },
    addressPostcode: { type: String, required: true, trim: true },
    pickupDate: { type: Date, required: true },
    customMessage: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "pickup_scheduled", "picked_up", "inspected", "paid", "rejected"],
      default: "new",
      index: true,
    },
    agreedToTerms: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const SellOrder =
  (models.SellOrder as mongoose.Model<ISellOrder> | undefined) ||
  model<ISellOrder>("SellOrder", SellOrderSchema);

export default SellOrder;
