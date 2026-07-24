#!/usr/bin/env bash
# Manual redeploy — pulls the latest image and restarts the app container.
# Normally you don't need this: pushing to `main` triggers it automatically
# via .github/workflows/deploy.yml. Use this only if you need to force a
# redeploy from the server itself (e.g. after editing .env or Caddyfile).
set -euo pipefail
cd /opt/worlebury-app
docker compose pull app
docker compose up -d
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
docker image prune -f
echo "Redeployed."
