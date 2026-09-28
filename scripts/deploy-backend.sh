#!/usr/bin/env bash
# Run on the Oracle server after git pull (called by GitHub Actions or manually).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${API_SERVICE_NAME:-backend}"

cd "$APP_DIR"

echo "==> Deploying backend from $APP_DIR (branch: $BRANCH)"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing dependencies"
npm install

echo "==> Backend: generate, migrate, build"
cd backend
npx prisma generate
npx prisma migrate deploy
npm run build

echo "==> Restarting API"
if command -v pm2 >/dev/null 2>&1 && pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
  pm2 restart "$SERVICE_NAME"
  pm2 save
elif systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl restart "$SERVICE_NAME"
else
  echo "WARN: No pm2 process or systemd unit named '$SERVICE_NAME'."
  echo "Start manually, e.g.: cd backend && npm run start"
  exit 1
fi

echo "==> Deploy complete"
