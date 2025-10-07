#!/usr/bin/env bash
set -euo pipefail

# Deployment + Nginx reverse proxy setup script
# Usage:
#   cd /srv/book-inventories
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Requirements:
# - Docker and Docker Compose plugin installed
# - .env file present in current directory with required variables
# - Optional: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN set in environment to login before pulling
# - VPS assumed to be Debian/Ubuntu-based (uses apt-get for Nginx/Certbot)

REQUIRED_ENV=(REGISTRY_IMAGE DATABASE_URL JWT_SECRET JWT_EXPIRATION JWT_REFRESH_SECRET JWT_REFRESH_EXPIRATION PORT)
OPTIONAL_ENV=(SERVER_NAME ENABLE_SSL CERTBOT_EMAIL)

# Use sudo when not root
SUDO=""
if [ "$(id -u)" != "0" ]; then
  SUDO="sudo"
fi

echo "[deploy] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is not installed. Aborting."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose plugin is not installed. Aborting."; exit 1; }

if [ ! -f .env ]; then
  echo "[deploy] Missing .env in $(pwd). Create it from deploy/.env.example and set your secrets."
  exit 1
fi

echo "[deploy] Loading environment from .env..."
set -a
source .env
set +a

echo "[deploy] Validating required environment variables..."
for var in "${REQUIRED_ENV[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "[deploy] Missing ${var} (not set in .env)"
    MISSING=1
  fi
done
if [ "${MISSING:-0}" -eq 1 ]; then
  echo "[deploy] Please populate missing variables in .env and retry."
  exit 1
fi

if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  echo "[deploy] Logging in to Docker Hub as ${DOCKERHUB_USERNAME}"
  echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

echo "[deploy] Pulling latest images..."
docker compose pull

echo "[deploy] Starting services..."
docker compose up -d --remove-orphans

echo "[deploy] Cleaning up unused images..."
docker image prune -f || true

echo "[deploy] Setting up Nginx reverse proxy..."
if ! command -v nginx >/dev/null 2>&1; then
  echo "[deploy] Nginx not found. Installing via apt-get..."
  $SUDO apt-get update -y
  $SUDO apt-get install -y nginx
fi

# Allow Nginx through UFW if present
if command -v ufw >/dev/null 2>&1; then
  $SUDO ufw allow 'Nginx Full' || true
fi

SERVER_NAME_VALUE="${SERVER_NAME:-_}"
NGINX_CONF_PATH="/etc/nginx/sites-available/book-inventories.conf"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/book-inventories.conf"

# Rate limiting variables with defaults
RATE_LIMIT_ZONE_NAME="${RATE_LIMIT_ZONE_NAME:-api_limit}"
RATE_LIMIT_ZONE_SIZE="${RATE_LIMIT_ZONE_SIZE:-10m}"
RATE_LIMIT_REQ_RATE="${RATE_LIMIT_REQ_RATE:-10r/s}"
RATE_LIMIT_BURST="${RATE_LIMIT_BURST:-20}"
RATE_LIMIT_DELAYED="${RATE_LIMIT_DELAYED:-false}"

LIMIT_CONN_ZONE_NAME="${LIMIT_CONN_ZONE_NAME:-addr}"
LIMIT_CONN_ZONE_SIZE="${LIMIT_CONN_ZONE_SIZE:-10m}"
LIMIT_CONN_PER_IP="${LIMIT_CONN_PER_IP:-20}"

# Write global rate limit zones (http context) in conf.d
RATE_FILE="/etc/nginx/conf.d/book-inventories-ratelimit.conf"
echo "[deploy] Writing rate limit zones to ${RATE_FILE}"
$SUDO tee "${RATE_FILE}" > /dev/null <<CONF
limit_req_zone \$binary_remote_addr zone=${RATE_LIMIT_ZONE_NAME}:${RATE_LIMIT_ZONE_SIZE} rate=${RATE_LIMIT_REQ_RATE};
limit_conn_zone \$binary_remote_addr zone=${LIMIT_CONN_ZONE_NAME}:${LIMIT_CONN_ZONE_SIZE};
CONF

# nodelay flag handling
DELAY_FLAG=""
if [ "${RATE_LIMIT_DELAYED}" = "false" ]; then
  DELAY_FLAG=" nodelay"
fi

echo "[deploy] Writing Nginx config to ${NGINX_CONF_PATH} (server_name: ${SERVER_NAME_VALUE})"
$SUDO tee "${NGINX_CONF_PATH}" > /dev/null <<NGINX
server {
  listen 80;
  server_name ${SERVER_NAME_VALUE};

  large_client_header_buffers 4 16k;

  # Limit concurrent connections per IP
  limit_conn ${LIMIT_CONN_ZONE_NAME} ${LIMIT_CONN_PER_IP};

  location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    # Rate limit requests per IP
    limit_req zone=${RATE_LIMIT_ZONE_NAME} burst=${RATE_LIMIT_BURST}${DELAY_FLAG};
  }

  location /swagger {
    proxy_pass http://127.0.0.1:${PORT}/swagger;
    proxy_set_header Host \$host;
  }
}
NGINX

if [ ! -e "${NGINX_ENABLED_PATH}" ]; then
  $SUDO ln -sf "${NGINX_CONF_PATH}" "${NGINX_ENABLED_PATH}"
fi

echo "[deploy] Testing and reloading Nginx..."
$SUDO nginx -t
$SUDO systemctl reload nginx

if [ "${ENABLE_SSL:-false}" = "true" ]; then
  if ! command -v certbot >/dev/null 2>&1; then
    echo "[deploy] Certbot not found. Installing..."
    $SUDO apt-get install -y certbot python3-certbot-nginx || true
  fi

  if [ -z "${CERTBOT_EMAIL:-}" ] || [ "${SERVER_NAME_VALUE}" = "_" ]; then
    echo "[deploy] ENABLE_SSL is true but CERTBOT_EMAIL or SERVER_NAME is missing. Skipping SSL setup."
  else
    echo "[deploy] Obtaining/renewing SSL certificate for ${SERVER_NAME_VALUE}..."
    $SUDO certbot --nginx -n -d "${SERVER_NAME_VALUE}" --agree-tos -m "${CERTBOT_EMAIL}" || true
  fi
fi

echo "[deploy] Done. App should be reachable on http://$(hostname -I | awk '{print $1}'):${PORT} and via http://${SERVER_NAME_VALUE}/ if DNS is configured."