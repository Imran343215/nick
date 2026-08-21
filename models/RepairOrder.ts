import mongoose, { Schema, model, models } from "mongoose";

export type OrderStatus =
  | "received"
  | "diagnosing"
  | "repairing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface IRepairOrderUpdate {
  status: OrderStatus | string;
  note?: string;
  at: Date;
}

export interface IRepairOrder {
  trackingId: string;
  customerName: string;
  device: string;
  service: string;
  price: number;
  status: OrderStatus;
  etaDays: number;
  updates: IRepairOrderUpdate[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  received: "You have been received at our workshop.",
  diagnosing: "Our technicians are diagnosing the issue.",
  repairing: "The repair is in progress.",
  ready: "Repair complete — your device is ready for pickup.",
  delivered: "Your device has been delivered back to you.",
  cancelled: "This repair order was cancelled.",
};

const RepairOrderSchema = new Schema<IRepairOrder>(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    device: { type: String, required: true, trim: true },
    service: { type: String, default: "General repair", trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["received", "diagnosing", "repairing", "ready", "delivered", "cancelled"],
      default: "received",
      index: true,
    },
    etaDays: { type: Number, default: 1 },
    updates: [
      {
        status: { type: String },
        note: { type: String, trim: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const RepairOrder =
  (models.RepairOrder as mongoose.Model<IRepairOrder> | undefined) ||
  model<IRepairOrder>("RepairOrder", RepairOrderSchema);

export default RepairOrder;