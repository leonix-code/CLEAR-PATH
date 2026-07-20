# ClearPath Caddy Reverse Proxy — Dockerfile
#
# Stages:
#   1. builder — validate Caddyfile syntax
#   2. runtime — minimal caddy image with config and static assets
#
# Build:
#   docker build -t clearpath-caddy -f docker/caddy/Dockerfile .
#
# Run (standalone):
#   docker run -p 8080:8080 clearpath-caddy
#
# Run (with docker-compose):
#   docker compose -f docker/docker-compose.yml up -d

# ── Stage 1: Builder ──
FROM caddy:2-alpine AS builder

# Copy the docker-specific Caddyfile
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile

# Validate the Caddyfile syntax
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# ── Stage 2: Runtime ──
FROM caddy:2-alpine

LABEL org.opencontainers.image.title="ClearPath Caddy Proxy"
LABEL org.opencontainers.image.description="Reverse proxy for ClearPath student clearance system"
LABEL org.opencontainers.image.version="1.0.0"

# Copy the validated Caddyfile from builder
COPY --from=builder /etc/caddy/Caddyfile /etc/caddy/Caddyfile

# Copy the landing page and other static assets
COPY index.html /usr/share/caddy/index.html

# Caddy exposes :80 (HTTP) and :443 (HTTPS) by default
# We use :8080 for the proxy
EXPOSE 8080

# Default command — run Caddy with our config
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
