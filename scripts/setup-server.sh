#!/usr/bin/env bash
# One-time bootstrap for a fresh Linode Ubuntu box.
#
# Run this FROM INSIDE an already-cloned copy of the repo — don't try to
# curl this file down on its own, it depends on other files in the repo
# (.env.example, Caddyfile, docker-compose.yml) sitting next to it. On the
# server:
#
#   git clone https://github.com/<you>/<repo>.git /opt/worlebury-app
#   cd /opt/worlebury-app
#   bash scripts/setup-server.sh
#
# This installs Docker + a firewall and prepares .env/Caddyfile for you to
# edit. It deliberately does NOT start the containers — there's no app image
# published yet at this point. The first real start happens automatically
# the first time you push to `main` on GitHub (see DEPLOYMENT.md Part 8-9).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Installing Docker + Compose plugin"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
apt-get update -y && apt-get install -y docker-compose-plugin ufw fail2ban

echo "==> Basic firewall (SSH + HTTP/HTTPS only)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from template — edit it with your real Supabase keys:"
  echo "    nano $APP_DIR/.env"
fi

echo ""
echo "==> Server prepared. Two things left before the app goes live:"
echo "  1. nano $APP_DIR/.env        — paste in your Supabase keys"
echo "  2. nano $APP_DIR/Caddyfile   — confirm your real subdomain"
echo ""
echo "Then, from your own computer, push to GitHub's main branch. GitHub"
echo "Actions builds the app image and starts it on this server automatically"
echo "— you don't need to run docker compose yourself. Make sure these"
echo "secrets are set first (repo Settings > Secrets and variables > Actions):"
echo "  LINODE_HOST, LINODE_USER, LINODE_SSH_KEY,"
echo "  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL"
