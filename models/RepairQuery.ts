import mongoose, { Schema } from "mongoose";

export type QueryStatus = "new" | "contacted" | "quoted" | "completed" | "closed";

export interface IRepairQuery {
  name: string;
  email: string;
  phone: string;
  deviceBrand: string;
  deviceModel?: string;
  issue: string;
  message?: string;
  preferredDate?: Date;
  status: QueryStatus;
  trackingId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairQuerySchema = new Schema<IRepairQuery>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, required: true, trim: true },
    deviceBrand: { type: String, required: true, trim: true },
    deviceModel: { type: String, default: "", trim: true },
    issue: { type: String, required: true, trim: true, maxlength: 2000 },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    preferredDate: { type: Date },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "completed", "closed"],
      default: "new",
      index: true,
    },
    trackingId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

const RepairQuery =
  mongoose.models.RepairQuery || mongoose.model<IRepairQuery>("RepairQuery", RepairQuerySchema);

export default RepairQuery;