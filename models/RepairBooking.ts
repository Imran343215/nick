import mongoose, { Schema, model, models } from "mongoose";

export type RepairBookingStatus =
  | "new"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface IRepairBookingService {
  serviceId: string;
  name: string;
  price: number;
  discountPrice?: number;
  lineTotal: number;
}

export interface IRepairBooking {
  bookingNumber: string;
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
  services: IRepairBookingService[];
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  savings: number;
  addressLabel?: string;
  addressLine: string;
  addressCity: string;
  addressPostcode: string;
  pickupDate: Date;
  repairMode: "home" | "store";
  customMessage?: string;
  status: RepairBookingStatus;
  agreedToTerms: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairBookingServiceSchema = new Schema<IRepairBookingService>(
  {
    serviceId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const RepairBookingSchema = new Schema<IRepairBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
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
    services: { type: [RepairBookingServiceSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    couponDiscount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    savings: { type: Number, default: 0, min: 0 },
    addressLabel: { type: String, trim: true },
    addressLine: { type: String, required: true, trim: true },
    addressCity: { type: String, required: true, trim: true },
    addressPostcode: { type: String, required: true, trim: true },
    pickupDate: { type: Date, required: true },
    repairMode: { type: String, enum: ["home", "store"], default: "home" },
    customMessage: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "confirmed", "scheduled", "in_progress", "completed", "cancelled"],
      default: "new",
      index: true,
    },
    agreedToTerms: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const RepairBooking =
  (models.RepairBooking as mongoose.Model<IRepairBooking> | undefined) ||
  model<IRepairBooking>("RepairBooking", RepairBookingSchema);

export default RepairBooking;
