#!/usr/bin/env bash
# deploy.sh — installs nginx (if needed) and serves the game from /var/www/touhou-game
# Run this ON THE VPS as a user with sudo access, from the folder containing
# index.html, style.css, js/ and touhou-game.nginx.conf (i.e. after unzipping/scp'ing there).
#
# Usage:  sudo bash deploy.sh [domain-or-IP]

set -euo pipefail

DOMAIN="${1:-_}"
WEBROOT="/var/www/touhou-game"
SITE_CONF="/etc/nginx/sites-available/touhou-game"

echo "==> Installing nginx (skips if already installed)..."
apt-get update -y
apt-get install -y nginx

echo "==> Creating webroot at ${WEBROOT}..."
mkdir -p "${WEBROOT}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "==> Copying game files from ${SCRIPT_DIR}..."
cp -r "${SCRIPT_DIR}/index.html" "${SCRIPT_DIR}/style.css" "${SCRIPT_DIR}/js" "${WEBROOT}/"

# copy optional asset folders if they exist alongside this script
for asset_dir in images fonts; do
  if [ -d "${SCRIPT_DIR}/${asset_dir}" ]; then
    echo "==> Copying ${asset_dir}/ ..."
    cp -r "${SCRIPT_DIR}/${asset_dir}" "${WEBROOT}/"
  else
    echo "==> WARNING: ${SCRIPT_DIR}/${asset_dir} not found, skipping (site will 404 on missing ${asset_dir})"
  fi
done

echo "==> Writing nginx site config..."
cp "${SCRIPT_DIR}/touhou-game.nginx.conf" "${SITE_CONF}"
if [ "${DOMAIN}" != "_" ]; then
  sed -i "s/server_name _;.*/server_name ${DOMAIN};/" "${SITE_CONF}"
fi

ln -sf "${SITE_CONF}" /etc/nginx/sites-enabled/touhou-game
# remove the default site if it's still serving on port 80 and would conflict
if [ -e /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

echo "==> Setting permissions..."
chown -R www-data:www-data "${WEBROOT}"
chmod -R 755 "${WEBROOT}"

echo "==> Testing and reloading nginx..."
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Opening firewall for HTTP (if ufw is active)..."
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx HTTP'
fi

IP=$(curl -s -4 ifconfig.me || echo "your-vps-ip")
echo ""
echo "✅ Deployed. Visit: http://${IP}/  (or http://${DOMAIN}/ once DNS points here)"
echo "   Game files live in: ${WEBROOT}"
echo "   To update after edits: re-run this script, or just re-copy files into ${WEBROOT}"