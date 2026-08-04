FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Cloud Run's filesystem is writable but ephemeral — fine for a demo, not for real
# persistence. data/ and uploads/ need to exist and be writable at startup.
RUN mkdir -p data uploads

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
