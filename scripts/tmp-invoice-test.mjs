/** Temporary smoke-test helper for the invoice feature (deleted after use).
 *  Usage: node --env-file=.env.local scripts/tmp-invoice-test.mjs insert|delete
 */
import dns from "dns";
import mongoose from "mongoose";

const [, , action] = process.argv;
const TEST_ORDER_NUMBER = "IT-INVTEST1";

/* Same workaround as lib/db.ts: some networks refuse Node's SRV lookups,
 * so fall back to public DNS servers when that happens. */
const uriHost = (() => {
  try {
    return new URL(process.env.MONGODB_URI || "").hostname;
  } catch {
    return "";
  }
})();
if (uriHost && (process.env.MONGODB_URI || "").startsWith("mongodb+srv://")) {
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${uriHost}`);
  } catch {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    console.warn("[tmp-invoice-test] OS DNS refused SRV; using public resolvers");
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const Model = mongoose.model(
  "InvoiceTestOrder",
  new mongoose.Schema({}, { strict: false }),
  "orders"
);

if (action === "insert") {
  await Model.deleteMany({ orderNumber: TEST_ORDER_NUMBER });
  const doc = await Model.create({
    orderNumber: TEST_ORDER_NUMBER,
    clerkUserId: "user_test_invoice_owner",
    productName: "iPhone 13 128GB Midnight",
    quantity: 1,
    unitPrice: 249.99,
    total: 249.99,
    currency: "gbp",
    customerName: "Imran Test",
    customerEmail: "imran.test@example.com",
    shippingAddress: "12 Test Lane\nLondon\nNW6 4TA",
    stripeSessionId: `cs_test_invoice_${Date.now()}`,
    paymentStatus: "paid",
    fulfillmentStatus: "pending",
  });
  console.log("INSERTED_ID=" + doc._id.toString());
} else if (action === "delete") {
  await Model.deleteMany({ orderNumber: TEST_ORDER_NUMBER });
  console.log("DELETED");
} else {
  console.error("Unknown action");
}

await mongoose.disconnect();
