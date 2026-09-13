import mongoose, { Schema, model, models } from "mongoose";

export interface IBannerSettings {
  /** Fixed singleton id ("banner"). */
  _id: string;
  enabled: boolean;
  autoplaySeconds: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BannerSettingsSchema = new Schema<IBannerSettings>(
  {
    _id: { type: String, required: true, default: "banner" },
    enabled: { type: Boolean, default: true },
    autoplaySeconds: { type: Number, default: 5, min: 2, max: 15 },
  },
  { timestamps: true }
);

const BannerSettings =
  (models.BannerSettings as mongoose.Model<IBannerSettings> | undefined) ||
  model<IBannerSettings>("BannerSettings", BannerSettingsSchema);

export default BannerSettings;
