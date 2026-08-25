import mongoose, { Schema, model, models } from "mongoose";

/**
 * SiteTheme — a single "singleton" document that stores the full landing page
 * theme configured from the admin Theme Customizer (/admin/theme).
 * The document is stored with a fixed _id ("site") so there is always at most one.
 */
export interface ISiteTheme {
  /** Fixed singleton id ("site"). Stored as a string, not ObjectId. */
  _id: string;
  brandName: string;
  brandInitials: string;
  brandTagline: string;
  logoUrl: string;

  colors: Record<string, string>;
  fonts: { body: string; display: string };
  radius: number;

  sections: {
    enabled: Record<string, boolean>;
    order: string[];
  };

  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    imageUrl: string;
    stats: { value: string; label: string }[];
  };

  headers: Record<string, { eyebrow: string; title: string; lead: string }>;

  contactCards: { icon: string; title: string; value: string; href: string }[];
  testimonials: { name: string; meta: string; stars: number; quote: string }[];

  footerText: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const SectionHeaderSchema = new Schema(
  {
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    lead: { type: String, default: "" },
  },
  { _id: false }
);

const SiteThemeSchema = new Schema<ISiteTheme>(
  {
    _id: { type: String, required: true, default: "site" },
    brandName: { type: String, default: "" },
    brandInitials: { type: String, default: "" },
    brandTagline: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    colors: { type: Schema.Types.Mixed, default: {} },
    fonts: {
      type: new Schema({ body: String, display: String }, { _id: false }),
      default: {},
    },
    radius: { type: Number, default: 14 },
    sections: {
      type: new Schema(
        {
          enabled: { type: Schema.Types.Mixed, default: {} },
          order: { type: [String], default: [] },
        },
        { _id: false }
      ),
      default: {},
    },
    hero: {
      type: new Schema(
        {
          badge: String,
          title: String,
          titleHighlight: String,
          subtitle: String,
          primaryLabel: String,
          primaryHref: String,
          secondaryLabel: String,
          secondaryHref: String,
          imageUrl: String,
          stats: [
            new Schema({ value: String, label: String }, { _id: false }),
          ],
        },
        { _id: false }
      ),
      default: {},
    },
    headers: { type: Schema.Types.Mixed, default: {} },
    contactCards: [
      new Schema(
        { icon: String, title: String, value: String, href: String },
        { _id: false }
      ),
    ],
    testimonials: [
      new Schema(
        { name: String, meta: String, stars: Number, quote: String },
        { _id: false }
      ),
    ],
    footerText: { type: String, default: "" },
  },
  { timestamps: true }
);

/**
 * Register the model. Dev hot reload can keep an older compiled model alive
 * on `mongoose.models`; if that cached model was built while `_id` still
 * defaulted to ObjectId (instead of our fixed "site" string), queries like
 * findById("site") would throw a CastError at runtime. Detect that case and
 * swap the stale model for the correct schema.
 */
let SiteTheme: mongoose.Model<ISiteTheme>;
const existing = models.SiteTheme as mongoose.Model<ISiteTheme> | undefined;
if (existing && existing.schema.path("_id")?.instance === "String") {
  SiteTheme = existing;
} else {
  if (existing) {
    mongoose.deleteModel("SiteTheme");
  }
  SiteTheme = model<ISiteTheme>("SiteTheme", SiteThemeSchema);
}

export default SiteTheme;
