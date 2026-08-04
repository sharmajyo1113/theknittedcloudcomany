FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are read from .env.production (part of the build
# context — see .dockerignore) by Next.js's own build-time env loading.
# Deliberately not re-declaring them as ARG/ENV here: an unset ARG defaults to
# an empty string, and an explicit ENV always overrides a .env file value in
# Next's load order — so doing that silently blanked out .env.production.
ENV NODE_ENV=production
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
