// One-off helper: create the default repair categories and optionally
// assign existing brands that have no category to "Mobile repair".
//
// Usage (from the project root):
//   node --env-file=.env.local scripts/add-repair-categories.mjs            → categories only
//   node --env-file=.env.local scripts/add-repair-categories.mjs --backfill → also assign uncategorised brands to Mobile repair
//
// Safe to re-run: categories are upserted by slug, brands are only touched when uncategorised.

import dns from "dns";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mobile_repair_shop";

const BACKFILL = process.argv.includes("--backfill");

async function ensureSrvResolvable() {
  if (!MONGODB_URI.startsWith("mongodb+srv://")) return;
  let host;
  try {
    host = new URL(MONGODB_URI).hostname;
  } catch {
    return;
  }
  if (!host) return;
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  } catch {
    const servers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) dns.setServers(servers);
  }
}

const RepairCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    icon: { type: String, required: true, trim: true },
    iconPublicId: { type: String, trim: true },
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

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    logo: { type: String, required: true, trim: true },
    logoPublicId: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "RepairCategory", index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

/* Placeholder-free SVG icons so no image upload is needed to get started.
   Admins can replace them per-category from the admin panel at any time. */
function icon(label, glyph) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="#12182b"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#ff9f1c" font-family="Arial, sans-serif">${glyph}</text><text x="48" y="84" font-size="9" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CATEGORIES = [
  { name: "Mobile repair", slug: "mobile-repair", order: 1, glyph: "\u{1F4F1}" },
  { name: "Laptop repair", slug: "laptop-repair", order: 2, glyph: "\u{1F4BB}" },
  { name: "Watch repair", slug: "watch-repair", order: 3, glyph: "\u231A" },
  { name: "Gaming console repair", slug: "gaming-console-repair", order: 4, glyph: "\u{1F3AE}" },
  { name: "Jewellery repair", slug: "jewellery-repair", order: 5, glyph: "\u{1F48E}" },
];

async function main() {
  await ensureSrvResolvable();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const safeUri = MONGODB_URI.replace(/\/\/.*@/, "//***:***@");
  console.log("Connected to", safeUri);

  const RepairCategory =
    mongoose.models.RepairCategory || mongoose.model("RepairCategory", RepairCategorySchema);
  const Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);

  const slugToId = new Map();
  let created = 0;
  let updated = 0;

  for (const cat of CATEGORIES) {
    const doc = await RepairCategory.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { name: cat.name, slug: cat.slug, icon: icon(cat.name, cat.glyph), status: "active", order: cat.order } },
      { new: true, upsert: true }
    ).lean();
    if (!doc.icon) {
      await RepairCategory.updateOne({ _id: doc._id }, { $set: { icon: icon(cat.name, cat.glyph) } });
    }
    slugToId.set(cat.slug, String(doc._id));
    if (doc.createdAt && doc.updatedAt && doc.createdAt.getTime() === doc.updatedAt.getTime()) created++;
    else updated++;
  }

  console.log(
    `Repair categories: ${await RepairCategory.countDocuments()} total (${created} newly created).`
  );

  if (BACKFILL) {
    const mobileId = slugToId.get("mobile-repair");
    const result = await Brand.updateMany(
      { $or: [{ category: { $exists: false } }, { category: null }] },
      { $set: { category: mobileId } }
    );
    console.log(`Backfill: ${result.modifiedCount} brand(s) without a category assigned to "Mobile repair".`);
  } else {
    const unassigned = await Brand.countDocuments({
      $or: [{ category: { $exists: false } }, { category: null }],
    });
    if (unassigned > 0) {
      console.log(
        `${unassigned} brand(s) have no category yet. Re-run with --backfill to put them under "Mobile repair", or assign them in Admin → Brands.`
      );
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("[add-repair-categories]", err);
  process.exit(1);
});