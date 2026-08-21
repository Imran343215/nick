// Full MongoDB Atlas connectivity + CRUD test with a working DNS server.
import fs from "fs";
import dns from "dns";
import mongoose from "mongoose";

// Point Node's resolver at public DNS servers (the OS one refuses SRV here).
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://i4imran322_db_user:wyXS3KP0Ib0ZzAFZ@cluster0.hhtss10.mongodb.net/";

async function main() {
  const lines = [];
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    lines.push("CONNECTION: OK");
    lines.push("DB NAME: " + mongoose.connection.name);

    const svc = mongoose.model(
      "Service",
      new mongoose.Schema({
        name: String,
        slug: String,
        description: String,
        category: String,
        priceFrom: Number,
      })
    );
    await svc.deleteMany({ slug: "connectivity-probe" });
    const created = await svc.create({
      name: "Connectivity Probe",
      slug: "connectivity-probe",
      description: "temporary",
      category: "Probe",
      priceFrom: 1,
    });
    const readBack = await svc.findOne({ slug: "connectivity-probe" });
    lines.push("WRITE_READ: OK id=" + created._id);
    lines.push("READBACK NAME: " + (readBack ? readBack.name : "MISSING"));
    await svc.deleteMany({ slug: "connectivity-probe" });
    lines.push("CLEANUP: OK");
  } catch (err) {
    lines.push("ERROR: " + (err instanceof Error ? err.message : String(err)));
    lines.push(
      "STACK: " + (err instanceof Error ? (err.stack || "").split("\n")[1] || "" : "")
    );
  } finally {
    try { await mongoose.disconnect(); } catch {}
    fs.writeFileSync("conn-test.log", lines.join("\n") + "\n", "utf-8");
  }
}

main();