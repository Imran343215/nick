import mongoose, { Schema, model, models } from "mongoose";

export interface IRepairCoupon {
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  status: "active" | "inactive";
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairCouponSchema = new Schema<IRepairCoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const RepairCoupon =
  (models.RepairCoupon as mongoose.Model<IRepairCoupon> | undefined) ||
  model<IRepairCoupon>("RepairCoupon", RepairCouponSchema);

export default RepairCoupon;
