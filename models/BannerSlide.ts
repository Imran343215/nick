import mongoose, { Schema, model, models } from "mongoose";

export interface IBannerSlide {
  imageUrl: string;
  imagePublicId?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
  status: "active" | "inactive";
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BannerSlideSchema = new Schema<IBannerSlide>(
  {
    // Required — a slide with no image is never rendered on the site.
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true },
    title: { type: String, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 240 },
    buttonLabel: { type: String, trim: true, maxlength: 40 },
    link: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const BannerSlide =
  (models.BannerSlide as mongoose.Model<IBannerSlide> | undefined) ||
  model<IBannerSlide>("BannerSlide", BannerSlideSchema);

export default BannerSlide;
