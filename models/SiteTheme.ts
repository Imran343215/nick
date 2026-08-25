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
  gradient: { from: string; to: string; angle: number };
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
    gradient: {
      type: new Schema(
        {
          from: { type: String, default: "#ff9f1c" },
          to: { type: String, default: "#ffd166" },
          angle: { type: Number, default: 110 },
        },
        { _id: false }
      ),
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
 * on `mongoose.models`; if that cached model predates a schema change it
 * silently misbehaves (e.g. strict mode stripping newly added fields on
 * save). Validate everything a cached model must have, otherwise swap it
 * for the freshly compiled schema.
 */
function isUsableCachedModel(m: mongoose.Model<ISiteTheme>): boolean {
  // Must use our fixed string singleton id ("site"), not ObjectId.
  const idOk = m.schema.path("_id")?.instance === "String";
  // Fields added after the first release — extend this list whenever the
  // schema gains new top-level fields.
  const gradientOk = Boolean(m.schema.path("gradient"));
  return idOk && gradientOk;
}

let SiteTheme: mongoose.Model<ISiteTheme>;
const existing = models.SiteTheme as mongoose.Model<ISiteTheme> | undefined;
if (existing && isUsableCachedModel(existing)) {
  SiteTheme = existing;
} else {
  if (existing) {
    mongoose.deleteModel("SiteTheme");
  }
  SiteTheme = model<ISiteTheme>("SiteTheme", SiteThemeSchema);
}

export default SiteTheme;
