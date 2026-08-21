// Seed script for the mobile repair shop.
//
// Populates the repair Services catalog and a demo RepairOrder (usable with
// tracking ID MRP-DEMO-1) so the landing page and tracking feature have data.
//
// Usage:
//   npm run seed          → create services + demo order (idempotent)
//   npm run seed --demo   → also create a sample RepairQuery
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

const RepairOrderSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    device: { type: String, required: true, trim: true },
    service: { type: String, default: "General repair", trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["received", "diagnosing", "repairing", "ready", "delivered", "cancelled"],
      default: "received",
    },
    etaDays: { type: Number, default: 1 },
    updates: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const RepairQuerySchema = new mongoose.Schema(
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
    issue: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    preferredDate: { type: Date },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "completed", "closed"],
      default: "new",
    },
    trackingId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

function getServiceModel() {
  return mongoose.models.Service || mongoose.model("Service", ServiceSchema);
}

function getOrderModel() {
  return mongoose.models.RepairOrder || mongoose.model("RepairOrder", RepairOrderSchema);
}

function getQueryModel() {
  return mongoose.models.RepairQuery || mongoose.model("RepairQuery", RepairQuerySchema);
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

const demoOrder = {
  trackingId: "MRP-DEMO-1",
  customerName: "Demo Customer",
  device: "Samsung Galaxy S23",
  service: "Battery Replacement",
  price: 49,
  status: "repairing",
  etaDays: 1,
  updates: [
    {
      status: "received",
      note: "Device received at our Springfield workshop",
      at: new Date(Date.now() - 3 * 86400000),
    },
    {
      status: "diagnosing",
      note: "Battery health at 72%; replacement recommended",
      at: new Date(Date.now() - 2 * 86400000),
    },
    {
      status: "repairing",
      note: "Installing premium battery — ETA 1 day",
      at: new Date(Date.now() - 1 * 86400000),
    },
  ],
};

const demoQuery = {
  name: "Demo Customer",
  email: "demo@example.com",
  phone: "+1 555 010-9999",
  deviceBrand: "Samsung",
  deviceModel: "Galaxy S23",
  issue: "Battery drains too fast",
  message: "Battery drops from 100% to 10% in a couple of hours.",
  preferredDate: new Date(Date.now() + 2 * 86400000),
  status: "quoted",
  trackingId: "MRP-DEMO-Q1",
};

async function main() {
  await ensureSrvResolvable();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const safeUri = MONGODB_URI.replace(/\/\/.*@/, "//***:***@");
  console.log("Connected to", safeUri);

  const Service = getServiceModel();
  const RepairOrder = getOrderModel();
  const RepairQuery = getQueryModel();

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

  // Demo repair order (for the tracking feature on the landing page).
  const orderExists = await RepairOrder.findOne({
    trackingId: demoOrder.trackingId,
  });
  if (!orderExists) {
    await RepairOrder.create(demoOrder);
    console.log(
      `Demo repair order created → use tracking ID "${demoOrder.trackingId}" to test the tracker.`
    );
  } else {
    console.log("Demo repair order already exists.");
  }

  // Optional sample query (--demo flag).
  if (process.argv.includes("--demo")) {
    const queryExists = await RepairQuery.findOne({
      trackingId: demoQuery.trackingId,
    });
    if (!queryExists) {
      await RepairQuery.create(demoQuery);
      console.log(`Sample repair query created → ${demoQuery.trackingId}`);
    } else {
      console.log("Sample repair query already exists.");
    }
  }

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