import "./load-env.js";
import express from "express";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { connectDB, ChatMessage, ChatLink } from "./db.js";

const logger = pino({ level: "silent" });

const OWNER_NUMBER = process.env.OWNER_NUMBER;
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const PORT = process.env.PORT || 3001;

if (!OWNER_NUMBER || !INTERNAL_API_SECRET) {
  console.error(
    "Missing required env vars. Check OWNER_NUMBER and INTERNAL_API_SECRET are set."
  );
  process.exit(1);
}

// ── Self-identity across WhatsApp namespaces ────────────────────────────────
// Recent client builds deliver your OWN messages inside a "<lid>@lid" address
// instead of "<number>@s.whatsapp.net" (the lid number looks nothing like your
// phone number). We learn our own lid when the session opens (sock.user.lid),
// persist it, and accept self-chat traffic under EITHER namespace — while
// never touching your real conversations with other people.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LID_FILE = path.join(HERE, "auth", "owner-lid.txt");

let ownLid = null;
try {
  ownLid = fs.readFileSync(LID_FILE, "utf8").trim().split("@")[0] || null;
} catch {
  // No persisted lid yet — fine, we'll learn it after connecting.
}

function persistOwnerLid(lidBare) {
  try {
    fs.mkdirSync(path.dirname(LID_FILE), { recursive: true });
    fs.writeFileSync(LID_FILE, `${lidBare}\n`, "utf8");
  } catch (err) {
    console.error("[wa] could not persist owner lid:", err?.message || err);
  }
}

function isSelfRemote(jid) {
  if (!jid) return false;
  const bare = String(jid).split(":")[0];
  return bare === OWNER_JID || (!!ownLid && bare === `${ownLid}@lid`);
}

let sock;
let connectionStatus = "connecting"; // "connecting" | "connected" | "disconnected"
let latestQr = null; // most recent QR, rendered at GET /qr
let qrCount = 0;

// ── Incoming WhatsApp diagnostics & reply routing ───────────────────────────
// Set WHATSAPP_DEBUG=0 to silence the per-message [wa] lines.
const WHATSAPP_DEBUG = process.env.WHATSAPP_DEBUG !== "0";
function dbg(label, obj) {
  if (WHATSAPP_DEBUG) console.log(`[wa] ${label}:`, JSON.stringify(obj));
}

// Recently active visitor sessions (sessionId -> last activity ms). Used as a
// fallback when an owner's quote can't be matched to a stored ChatLink — e.g.
// newer WhatsApp clients sometimes reference companion-device messages with a
// rewritten stanza id. Exact quote matching ALWAYS wins when it works.
const recentSessions = new Map();
let sessionsSeeded = false;

async function seedRecentSessions() {
  if (sessionsSeeded) return;
  sessionsSeeded = true;
  try {
    const docs = await ChatMessage.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    for (const d of docs) {
      const t = d.createdAt ? new Date(d.createdAt).getTime() : Date.now();
      recentSessions.set(
        d.sessionId,
        Math.max(recentSessions.get(d.sessionId) ?? 0, t)
      );
    }
  } catch (err) {
    console.error("[wa] failed seeding recent sessions:", err?.message || err);
  }
}

function rememberVisitorSession(sessionId) {
  recentSessions.set(sessionId, Date.now());
}

function guessRecentSession() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [sid, t] of recentSessions) {
    if (t < cutoff) recentSessions.delete(sid);
  }
  let best = null;
  let bestTs = -1;
  for (const [sid, t] of recentSessions) {
    if (t > bestTs) {
      bestTs = t;
      best = sid;
    }
  }
  return best ? { sessionId: best, candidates: recentSessions.size } : null;
}

// messages.upsert can deliver the same event twice (initial notify + sync
// append). Track processed keys so owner replies aren't stored twice.
const seenKeys = new Set();
function markSeen(key) {
  if (seenKeys.has(key)) return false;
  seenKeys.add(key);
  if (seenKeys.size > 1000) {
    const it = seenKeys.values();
    for (let i = 0; i < 250; i++) seenKeys.delete(it.next().value);
  }
  return true;
}

// Unwrap common envelope shells (view-once, ephemeral, ...) so quote info and
// text survive however the sender's client packaged the message.
function unwrapMessage(message) {
  let m = message;
  const wrappers = [
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "ephemeralMessage",
    "documentWithCaptionMessage",
  ];
  let depth = 0;
  while (m && depth++ < 4) {
    let next = null;
    for (const k of wrappers) {
      if (m[k]?.message) {
        next = m[k].message;
        break;
      }
    }
    if (!next) break;
    m = next;
  }
  return m;
}

const CONTEXT_BEARERS = [
  "extendedTextMessage",
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "documentMessage",
  "stickerMessage",
  "contactMessage",
  "contactsArrayMessage",
  "locationMessage",
  "liveLocationMessage",
  "listResponseMessage",
  "buttonsResponseMessage",
  "templateButtonReplyMessage",
];

function extractContextInfo(message) {
  if (!message) return undefined;
  for (const key of CONTEXT_BEARERS) {
    if (message[key]?.contextInfo) return message[key].contextInfo;
  }
  return undefined;
}

function extractText(message) {
  if (!message) return "";
  const m = message;
  return (
    m.extendedTextMessage?.text ||
    m.conversation ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.listResponseMessage?.title ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    ""
  );
}

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(
        `\n📱 On your phone: WhatsApp → Linked devices → Link a device (QR #${++qrCount})\n` +
          "   If the phone camera struggles with this terminal QR, open\n" +
          `   http://localhost:${PORT}/qr in a browser for a cleaner one.\n`
      );
      qrcode.generate(qr, { small: true }, (out) => {
        latestQr = out;
        console.log(out);
      });
    }

    if (connection === "open") {
      connectionStatus = "connected";
      latestQr = null;
      console.log(`✅ Connected to WhatsApp as ${sock.user?.id || "unknown"}`);

      const rawLid =
        sock.user?.lid || sock.user?.lidJid || sock.user?.lidPn || "";
      const bareLid = String(rawLid).split(":")[0].split("@")[0];
      if (rawLid && bareLid !== ownLid) {
        ownLid = bareLid;
        persistOwnerLid(bareLid);
        console.log(
          `[wa] learned own LID ${ownLid} — replies from "<lid>@lid" chats will now route correctly`
        );
      }
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      const boomOutput = new Boom(lastDisconnect?.error)?.output;
      const statusCode = boomOutput?.statusCode;
      const reason =
        boomOutput?.payload?.message || lastDisconnect?.error?.message;

      if (statusCode === DisconnectReason.loggedOut) {
        latestQr = null;
        console.log(
          "❌ Logged out from WhatsApp. Delete the auth/ folder and restart to relink."
        );
      } else {
        // This line is the key diagnostic when a scanned QR doesn't link:
        // e.g. "Stream Errored (conflict)", "precondition required",
        // "timedOut" all point to different fixes.
        console.log(
          `Connection closed (${statusCode ?? "?"}) — ${
            reason || "no details"
          }; reconnecting...`
        );
        startSock();
      }
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    try {
      for (const raw of m.messages) {
        if (!raw.message) continue;
        const msg = { ...raw, message: unwrapMessage(raw.message) };

        const fromMe = Boolean(msg.key.fromMe);
        const dedupeKey = `${fromMe ? "me" : "them"}:${msg.key.remoteJid}:${msg.key.id}`;
        if (!markSeen(dedupeKey)) {
          dbg("duplicate upsert skipped", { key: dedupeKey });
          continue;
        }

        const contextInfo = extractContextInfo(msg.message);
        const stanzaId = contextInfo?.stanzaId
          ? String(contextInfo.stanzaId)
          : "";
        const text = extractText(msg.message);
        // Owner replies may arrive as the phone-number JID *or* as our own
        // "<lid>@lid" chat — accept both, never other people's conversations.
        const isSelfChat = isSelfRemote(msg.key.remoteJid);

        dbg("upsert", {
          fromMe,
          jid: msg.key.remoteJid,
          id: msg.key.id,
          hasQuote: Boolean(contextInfo),
          stanzaId,
          text: text.slice(0, 80),
        });

        // Ignore the echoes of the broadcasts WE sent to the owner
        // (unquoted forward-template bodies), so they never masquerade as
        // owner replies hitting the fallback router.
        if (
          fromMe &&
          isSelfChat &&
          !contextInfo &&
          text.startsWith("💬")
        ) {
          dbg("own forward echo ignored", { id: msg.key.id });
          continue;
        }

        if (!text) continue;

        // Route the reply to a visitor session: exact quote match first,
        // recent-session heuristic as a safety net.
        let sessionId = null;
        let via = "";
        if (stanzaId) {
          const link = await ChatLink.findOne({ waMessageId: stanzaId }).lean();
          if (link) {
            sessionId = link.sessionId;
            via = "quote-match";
          } else {
            dbg("quote stanzaId not in ChatLink — will try fallback", {
              stanzaId,
            });
          }
        }
        if (!sessionId && fromMe && isSelfChat) {
          await seedRecentSessions();
          const guess = guessRecentSession();
          if (guess) {
            sessionId = guess.sessionId;
            via =
              guess.candidates === 1
                ? "fallback-single-recent"
                : "fallback-most-recent";
          } else {
            dbg("no recent visitor sessions — cannot route reply");
          }
        }

        if (!sessionId) continue;

        await ChatMessage.create({
          sessionId,
          from: "owner",
          text,
        });

        console.log(`↩️  Owner reply (${via}) → session ${sessionId}`);
      }
    } catch (err) {
      console.error("Error handling messages.upsert:", err);
    }
  });
}

await connectDB();
startSock();

const app = express();
app.use(express.json());

app.post("/send", async (req, res) => {
  if (req.header("x-internal-secret") !== INTERNAL_API_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { sessionId, text, name } = req.body || {};
  if (!sessionId || !text) {
    return res
      .status(400)
      .json({ ok: false, error: "sessionId and text are required" });
  }

  if (!sock || connectionStatus !== "connected") {
    return res.status(503).json({ ok: false, error: "whatsapp not connected" });
  }

  try {
    const visitorMessage = await ChatMessage.create({
      sessionId,
      from: "visitor",
      text,
    });

    const body = `💬 ${name || "Someone"} on your site:\n\n${text}\n\n— Reply to THIS message to answer them.`;
    const sent = await sock.sendMessage(OWNER_JID, { text: body });

    await ChatLink.updateOne(
      { waMessageId: sent.key.id },
      { $set: { waMessageId: sent.key.id, sessionId } },
      { upsert: true }
    );

    rememberVisitorSession(sessionId);

    res.json({ ok: true, createdAt: visitorMessage.createdAt });
  } catch (err) {
    console.error("Error in /send:", err);
    res.status(500).json({ ok: false, error: "failed to send" });
  }
});

// Browser-friendly QR. Terminals (especially Windows/VS Code ones) often wrap
// or ANSI-mangle the wide ASCII art, so the phone decodes garbage and simply
// won't link. This page renders the current QR crisply on a white background.
app.get("/qr", (_req, res) => {
  const qrHtml = latestQr
    ? '<!doctype html><meta charset="utf-8"><title>Link WhatsApp device</title>' +
      '<body style="font-family:sans-serif;text-align:center;background:#fff;color:#111;padding:20px">' +
      "<h3>📱 Phone: WhatsApp → Settings → Linked devices → Link a device</h3>" +
      '<pre style="display:inline-block;padding:12px;line-height:1;font-size:13px;background:#f9f9f9;border-radius:8px">' +
      latestQr +
      "</pre>" +
      `<p style="color:#666">Latest QR (#${qrCount}) — it regenerates every ~60s while waiting.</p>` +
      '<p><button onclick="location.reload()" style="padding:10px 20px;font-size:16px;cursor:pointer;border:none;background:#25d366;color:#fff;border-radius:8px">🔄 Refresh QR</button></p>' +
      '<script>setTimeout(()=>location.reload(), 50000);</script>' +
      "</body>"
    : '<!doctype html><meta charset="utf-8"><title>Link WhatsApp device</title>' +
      '<body style="font-family:sans-serif;text-align:center;background:#fff;color:#111;padding:20px">' +
      "<h3>⏳ No QR is currently pending</h3>" +
      "<p>The session is starting up or waiting for a new QR to generate.</p>" +
      '<p><button onclick="location.reload()" style="padding:10px 20px;font-size:16px;cursor:pointer;border:none;background:#25d366;color:#fff;border-radius:8px">🔄 Refresh</button></p>' +
      '<script>setTimeout(()=>location.reload(), 15000);</script>' +
      '<p style="color:#999;margin-top:20px">If this persists, check <a href="/health">/health</a></p>' +
      "</body>";
  res.type("html").send(qrHtml);
});

app.get("/health", (req, res) => {
  res.json({ ok: true, status: connectionStatus });
});

app.listen(PORT, () => {
  console.log(`Baileys bridge listening on port ${PORT}`);
  console.log(`To link a phone, open http://localhost:${PORT}/qr`);
});
