# Multi-stage Vite + nginx image, tuned for Railway.
# Railway injects a random $PORT; nginx picks it up via envsubst at runtime.

# ---------- 1. Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first so layer cache survives source-only changes.
COPY package*.json ./
RUN npm ci

COPY . .

# Vite build-time env. Railway exposes these as build-args via railway.json
# (or "Build Variables" in the dashboard); they're baked into the bundle.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

# ---------- 2. Runtime stage ----------
FROM nginx:1.27-alpine AS runner

# nginx:alpine auto-runs envsubst on every file in /etc/nginx/templates/ and
# writes the rendered output into /etc/nginx/conf.d/. That's how we inject
# Railway's $PORT into the server block. We restrict the substituted vars so
# nginx-internal `$uri`, `$host`, etc. are left alone.
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_FILTER='^PORT$' \
    PORT=8080

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove the default site shipped in the base image so our config is the only one.
RUN rm -f /etc/nginx/conf.d/default.conf

# Document the port; Railway will override $PORT and route public traffic to it.
EXPOSE 8080

# Healthcheck hits the dedicated /healthz route on $PORT.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1

# Default CMD from the base image already runs envsubst then starts nginx.
