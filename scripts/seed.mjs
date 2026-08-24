// Seed script for the mobile repair shop.
//
// Populates the repair Services catalog shown on the landing page.
//
// Usage:
//   npm run seed          → create services (idempotent)
//
// Run from the project root with:
//   node --env-file=.env.local scripts/seed.mjs [--demo]

import dns from "dns";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mobile_repair_shop";

/* Fall back to public DNS servers when the OS resolver refuses SRV lookups
   (needed for `mongodb+srv://` Atlas connection strings on some networks). */
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
    if (servers.length > 0) {
      dns.setServers(servers);
      console.warn(
        `[seed] OS DNS refused SRV lookup; using explicit DNS servers: ${servers.join(", ")}`
      );
    }
  }
}

/* ---------- Schemas (mirror the TypeScript models) ---------- */

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: "General", trim: true },
    priceFrom: { type: Number, required: true, min: 0 },
    turnaroundDays: { type: Number, default: 1 },
    icon: { type: String, default: "🔧" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function getServiceModel() {
  return mongoose.models.Service || mongoose.model("Service", ServiceSchema);
}

/* ---------- Seed data ---------- */

const services = [
  {
    name: "Screen Repair & Replacement",
    category: "Display",
    priceFrom: 79,
    turnaroundDays: 1,
    icon: "🖥️",
    featured: true,
    description:
      "Cracked, shattered or unresponsive screens replaced with genuine OLED/LCD panels — including the touch digitizer in most cases.",
  },
  {
    name: "Battery Replacement",
    category: "Battery",
    priceFrom: 49,
    turnaroundDays: 1,
    icon: "🔋",
    featured: true,
    description:
      "Restore all-day battery life. Original and premium batteries available, with health diagnostics included.",
  },
  {
    name: "Water / Liquid Damage Repair",
    category: "Repair",
    priceFrom: 129,
    turnaroundDays: 2,
    icon: "💧",
    featured: true,
    description:
      "Ultrasonic cleaning, corrosion treatment and component-level repair for phones exposed to water or other liquids.",
  },
  {
    name: "Charging Port Repair",
    category: "Electronics",
    priceFrom: 59,
    turnaroundDays: 1,
    icon: "🔌",
    featured: false,
    description:
      "Loose, broken or finicky charging ports cleaned and re-seated so your cable clicks in solidly again.",
  },
  {
    name: "Camera & Lens Repair",
    category: "Electronics",
    priceFrom: 69,
    turnaroundDays: 2,
    icon: "📷",
    featured: false,
    description:
      "Fix black screens, cracked glass, stuck shutters and autofocus issues on rear and selfie cameras.",
  },
  {
    name: "Software & Performance Tuning",
    category: "Software",
    priceFrom: 39,
    turnaroundDays: 1,
    icon: "⚙️",
    featured: false,
    description:
      "Device stuck, crashing or out of storage? We clean, update and optimise your phone for fast, stable performance.",
  },
];

async function main() {
  await ensureSrvResolvable();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const safeUri = MONGODB_URI.replace(/\/\/.*@/, "//***:***@");
  console.log("Connected to", safeUri);

  const Service = getServiceModel();

  // Services (idempotent upsert by slug).
  let inserted = 0;
  for (const svc of services) {
    const slug = svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await Service.findOne({ slug });
    if (existing) continue;
    await Service.create({ ...svc, slug });
    inserted++;
  }
  console.log(
    `Services catalog: ${await Service.countDocuments()} total (${inserted} new).`
  );

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  const msg = err instanceof Error ? (err.stack || err.message) : String(err);
  console.error("Seeding failed:", msg);
  try { require("fs").writeFileSync("seed-error.log", msg + "\n", "utf-8"); } catch {}
  mongoose.disconnect();
  process.exit(1);
});