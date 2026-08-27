# WhatsApp bridge (baileys-service)

Always-on Node process that holds a **WhatsApp Web socket** (via Baileys) so the
site's floating chat widget can forward visitor messages to the shop owner's
personal WhatsApp, and owner quote-replies can be written back into MongoDB.

This runs on its own machine/VM — **not** on Vercel — because Vercel serverless
functions cannot maintain a persistent WebSocket session.

## One-time setup

```bash
cd baileys-service
npm install
cp .env.example .env.local     # then fill in the real values
npm start
```

`.env.local` variables:

| Variable | Meaning |
|---|---|
| `MONGODB_URI` | Same Atlas URI the site uses — both sides share the `chatmessages` / `chatlinks` collections |
| `OWNER_NUMBER` | Your personal WhatsApp number, international format digits only, no `+` (e.g. `918820768204`). Visitor messages go here |
| `INTERNAL_API_SECRET` | Long random string; must match the site's own `INTERNAL_API_SECRET` in `../.env.local` |
| `PORT` | Defaults to `3001` |
| `DNS_SERVERS` | Optional. If your network refuses MongoDB Atlas SRV lookups, fallback resolvers used (default `1.1.1.1,8.8.8.8`) |

## Linking the phone

```bash
npm start
```

1. A QR appears in the terminal **and** a cleaner version is served at
   `http://localhost:3001/qr` — prefer opening that page in a desktop browser;
   Windows terminals often wrap/mangle the ASCII art, making it unscannable.
2. On the phone: **WhatsApp → Settings → Linked devices → Link a device** and
   scan promptly (the QR rotates roughly every minute; always scan the newest).
3. Success looks like `✅ Connected to WhatsApp as <your-jid>` in the console,
   and `http://localhost:3001/health` reporting `"status":"connected"`.

Rules to live by:

- **Only one bridge per port.** A second `npm start` dies with `EADDRINUSE`.
- **If linking keeps failing**, delete the `auth/` folder, stop everything,
  wait ~5 minutes (WhatsApp throttles device-link attempts), and retry.
- Session credentials persist in `auth/` — the QR is only needed once per
  device unless you get `❌ Logged out`, which requires deleting `auth/`.

## HTTP API

| Route | Description |
|---|---|
| `POST /send` | Body `{ sessionId, text, name }`, header `x-internal-secret`. Sends the visitor's message to the owner's WhatsApp |
| `GET /health` | `{ ok, status }` where status is `connecting` / `connected` / `disconnected` |
| `GET /qr` | Browser-friendly current QR while waiting to link |

## Diagnosing disconnects

Disconnect reasons are printed, e.g. `Connection closed (440) — Stream Errored`.
`timedOut` / rapid QR rotation usually means "scan faster", persistent stream
errors right after a successful scan suggest trying a newer Baileys release
(`@whiskeysockets/baileys@7.0.0-rc14` was latest when this was built).

Every incoming/outgoing WhatsApp frame is logged as `[wa] ...` while it happens
(set `WHATSAPP_DEBUG=0` in `.env.local` to quiet it down). When you quote-reply
to a forwarded message you want to see either `↩️  Owner reply (quote-match)`
or `↩️  Owner reply (fallback-...)`; `fallback` means the quoted id didn't match
the stored link and the reply was routed to the most recently active visitor
session instead. If multiple visitors were chatting simultaneously, prefer
scanning `[wa] upsert` lines for the real `stanzaId` before trusting a
fallback attribution.