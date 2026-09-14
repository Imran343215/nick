FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create auth directory for WhatsApp session
RUN mkdir -p /app/auth

# Expose port (Railway sets PORT env var dynamically, default to 3001 for local)
EXPOSE ${PORT:-3001}

# Health check - uses PORT env var to match the actual listening port
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "const port=process.env.PORT||3001;fetch('http://localhost:'+port+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the service
CMD ["node", "index.js"]
