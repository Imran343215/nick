import mongoose, { Schema, model, models } from "mongoose";

export interface IOrder {
  orderNumber: string;
  clerkUserId?: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: "gbp";
  customerName: string;
  customerEmail: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  shippingNumber?: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentStatus: "pending" | "paid" | "failed";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  notifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    clerkUserId: { type: String, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["gbp"], default: "gbp" },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    shippingAddress: { type: String, trim: true },
    shippingCarrier: { type: String, trim: true },
    shippingNumber: { type: String, trim: true },
    stripeSessionId: { type: String, required: true, unique: true, index: true },
    stripePaymentIntentId: { type: String },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

const Order =
  (models.Order as mongoose.Model<IOrder> | undefined) ||
  model<IOrder>("Order", OrderSchema);

export default Order;