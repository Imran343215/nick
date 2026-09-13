import mongoose from "mongoose";
import dns from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI env var.");
  process.exit(1);
}

// Some networks refuse DNS SRV lookups from the OS resolver, which
// mongodb+srv:// connection strings depend on. Same workaround as lib/db.ts
// in the main app: fall back to explicit public DNS servers (overridable via
// the DNS_SERVERS env var).
let srvChecked = false;
async function ensureSrvResolvable() {
  if (srvChecked || !MONGODB_URI.startsWith("mongodb+srv://")) return;
  srvChecked = true;

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
        `[db] OS DNS refused SRV lookup; using explicit DNS servers: ${servers.join(", ")}`
      );
    }
  }
}

let connected = false;

export async function connectDB() {
  if (connected) return mongoose;
  await ensureSrvResolvable();

  // Ensure the URI has a database name. If missing, append the default db name.
  let uri = MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "baileys";
  // Check if URI already has a database name after the host (e.g. /dbname?params)
  // mongodb+srv://user:pass@cluster.mongodb.net/ -> no db name
  // mongodb+srv://user:pass@cluster.mongodb.net/baileys -> has db name
  try {
    const url = new URL(uri);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = `/${dbName}`;
      uri = url.toString();
    }
  } catch {
    // If URL parsing fails, try simple string check
    const afterHost = uri.split("/").slice(3); // ["", "dbname?params"] or ["", "?params"]
    if (afterHost.length <= 1 || afterHost[1] === "" || afterHost[1].startsWith("?")) {
      // No database name present
      const separator = uri.includes("?") ? "&" : "?";
      // Insert db name before query params
      const qIndex = uri.indexOf("?");
      if (qIndex === -1) {
        uri = `${uri}/${dbName}`;
      } else {
        uri = `${uri.slice(0, qIndex)}/${dbName}${uri.slice(qIndex)}`;
      }
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  connected = true;
  return mongoose;
}

// Same shape and model names as models/ChatMessage.ts and models/ChatLink.ts
// in the Next.js app, so this process and the site share the same
// "chatmessages" / "chatlinks" collections.

const ChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    from: { type: String, enum: ["visitor", "owner"], required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatLinkSchema = new mongoose.Schema(
  {
    waMessageId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", ChatMessageSchema);

export const ChatLink =
  mongoose.models.ChatLink || mongoose.model("ChatLink", ChatLinkSchema);
