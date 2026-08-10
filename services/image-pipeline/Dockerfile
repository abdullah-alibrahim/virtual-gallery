# Image pipeline — Cloud Run service (Phase 2 scaffold)
#
# Production path: Storage finalize → Pub/Sub → this service.
# Local path: Next.js `/api/assets/[id]/process` runs the same sharp logic.
#
# Build:
#   docker build -t vg-image-pipeline ./services/image-pipeline
#
# Env:
#   GOOGLE_CLOUD_PROJECT
#   BASISU_BIN=/usr/local/bin/basisu   # optional; enables real KTX2

FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src

ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.mjs"]
