# Deploying baileys-service to Railway

This service needs to run 24/7 to maintain the WhatsApp WebSocket connection. Vercel serverless functions can't do this, so we use Railway (or Render) for the always-on bridge.

## Prerequisites

1. A [Railway](https://railway.app) account
2. Your MongoDB connection string (same as your Vercel app uses)
3. A phone number to link with WhatsApp

## Quick Deploy

### Option 1: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd baileys-service
railway init

# Add persistent volume for auth folder
railway volume add --mount-path /app/auth

# Set environment variables
railway variables set OWNER_NUMBER=1234567890
railway variables set INTERNAL_API_SECRET=your-secret-here
railway variables set MONGODB_URI=mongodb+srv://...

# Deploy
railway up
```

### Option 2: Deploy via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Choose your repository and the `baileys-service` directory
4. Add a persistent volume:
   - Mount path: `/app/app/auth`
   - This ensures WhatsApp session survives restarts
5. Set environment variables (see below)
6. Deploy

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OWNER_NUMBER` | Your WhatsApp phone number with country code (e.g., `1234567890`) |
| `INTERNAL_API_SECRET` | Shared secret between Vercel and this service |
| `MONGODB_URI` | MongoDB connection string |

## Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port to listen on |
| `WHATSAPP_DEBUG` | `true` | Set to `0` to silence debug logs |

## After Deploy

1. Get your Railway URL: `https://your-app.up.railway.app`
2. Visit `https://your-app.up.railway.app/qr` to link your phone
3. Scan the QR code with WhatsApp → Settings → Linked devices
4. Check `https://your-app.up.railway.app/health` to confirm connection

## Connect Vercel to Railway

In your Vercel project settings, add these environment variables:

```
BAILEYS_SERVICE_URL=https://your-app.up.railway.app
INTERNAL_API_SECRET=your-secret-here
```

## Alternative: Render

If you prefer Render:

1. Create a new **Web Service**
2. Set build command: `npm install`
3. Set start command: `node index.js`
4. Add a **Disk** (persistent storage):
   - Mount path: `/opt/render/project/src/auth`
5. Set environment variables
6. Deploy

## Troubleshooting

- **QR code not working**: Make sure you're viewing `/qr` in a browser, not a terminal
- **Session lost after restart**: Ensure the persistent volume is mounted correctly
- **Connection drops**: Railway free tier may sleep; upgrade to paid for always-on
