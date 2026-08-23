import mongoose, { Schema, model, models } from "mongoose";

export interface IRepairAddress {
  clerkUserId: string;
  label: string;
  line1: string;
  city: string;
  postcode: string;
  phone: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairAddressSchema = new Schema<IRepairAddress>(
  {
    clerkUserId: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true, default: "Home" },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const RepairAddress =
  (models.RepairAddress as mongoose.Model<IRepairAddress> | undefined) ||
  model<IRepairAddress>("RepairAddress", RepairAddressSchema);

export default RepairAddress;
