#!/bin/bash
# =============================================================
# activate_release.sh — Run this AS ROOT on the VPS
# Activates release: /var/www/theceo/releases/manual-20261102
# =============================================================
set -e

RELEASE_DIR="/var/www/theceo/releases/manual-20261102"
BACKEND_DIR="$RELEASE_DIR/backend"
FRONTEND_DIR="$RELEASE_DIR/frontend"
OLD_RELEASE="/var/www/theceo/releases/20261022T170512Z"
SERVICE_NAME="theceo_backend"

echo ""
echo "============================================================"
echo "  TheCeo — Activating Release: manual-20261102"
echo "============================================================"
echo ""

# ── STEP 1: Copy .env from old release ──────────────────────
echo "[1/8] Copying .env from previous release..."
if [ -f "$OLD_RELEASE/backend/.env" ]; then
    cp "$OLD_RELEASE/backend/.env" "$BACKEND_DIR/.env"
    echo "      ✅ Copied from $OLD_RELEASE/backend/.env"
else
    echo "      ⚠️  Old .env not found. Writing default .env..."
    cat > "$BACKEND_DIR/.env" << 'ENVEOF'
SECRET_KEY=django-insecure-please-change-this-to-a-real-secret-key-now
DEBUG=False
ALLOWED_HOSTS=theceoinfluencers.com,www.theceoinfluencers.com,72.62.251.242,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://theceoinfluencers.com,https://www.theceoinfluencers.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=tci_db
DB_USER=tci_db_user
DB_PASSWORD=78R3]eU$Ke≠kDLIGCV>Ud+
DB_HOST=127.0.0.1
DB_PORT=5432
REDIS_URL=redis://127.0.0.1:6379/1
JWT_COOKIE_SECURE=True
ENVEOF
fi

# Ensure critical production settings are correct in .env
echo "      Patching DEBUG=False and port=5432..."
sed -i 's/^DEBUG=True/DEBUG=False/' "$BACKEND_DIR/.env"
sed -i 's/^DB_PORT=5433/DB_PORT=5432/' "$BACKEND_DIR/.env"
# Add CSRF/ALLOWED_HOSTS if missing
grep -q "CSRF_TRUSTED_ORIGINS" "$BACKEND_DIR/.env" || \
    echo "CSRF_TRUSTED_ORIGINS=https://theceoinfluencers.com,https://www.theceoinfluencers.com" >> "$BACKEND_DIR/.env"
grep -q "theceoinfluencers.com" "$BACKEND_DIR/.env" || \
    sed -i 's/^ALLOWED_HOSTS=.*/ALLOWED_HOSTS=theceoinfluencers.com,www.theceoinfluencers.com,72.62.251.242,localhost,127.0.0.1/' "$BACKEND_DIR/.env"

echo ""
echo "      Current .env (secrets masked):"
grep -v PASSWORD "$BACKEND_DIR/.env" | grep -v SECRET_KEY | grep -v API_KEY || true
echo ""

# ── STEP 2: Python venv & pip install ───────────────────────
echo "[2/8] Setting up Python virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv venv
echo "      Installing Python dependencies (this may take a minute)..."
"$BACKEND_DIR/venv/bin/pip" install --upgrade pip -q
"$BACKEND_DIR/venv/bin/pip" install -r requirements.txt -q
echo "      ✅ Python dependencies installed"

# ── STEP 3: Django migrate ───────────────────────────────────
echo ""
echo "[3/8] Running Django migrations..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/python" manage.py migrate --noinput
echo "      ✅ Migrations complete"

# ── STEP 4: Collect static files ────────────────────────────
echo ""
echo "[4/8] Collecting static files..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/python" manage.py collectstatic --noinput -v 0
echo "      ✅ Static files collected → $BACKEND_DIR/staticfiles/"

# ── STEP 5: Build React frontend ────────────────────────────
echo ""
echo "[5/8] Building React frontend (npm install + vite build)..."
cd "$FRONTEND_DIR"

# Use Node 18+ if nvm is available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

npm install --legacy-peer-deps
npm run build
echo "      ✅ Frontend built → $FRONTEND_DIR/dist/"

# ── STEP 6: Fix file ownership ───────────────────────────────
echo ""
echo "[6/8] Fixing file ownership (www-data)..."
chown -R www-data:www-data "$RELEASE_DIR" 2>/dev/null || true
echo "      ✅ Ownership updated"

# ── STEP 7: Update systemd service ──────────────────────────
echo ""
echo "[7/8] Updating systemd service to point to new release..."

cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Gunicorn/Daphne daemon for TheCeo
After=network.target redis.service postgresql.service

[Service]
User=root
Group=www-data
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/daphne \\
    -b 127.0.0.1 \\
    -p 8000 \\
    tci_backend.asgi:application
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl restart "$SERVICE_NAME"
sleep 3
systemctl is-active --quiet "$SERVICE_NAME" && \
    echo "      ✅ Backend service is running" || \
    { echo "      ❌ Backend service FAILED — check: journalctl -u $SERVICE_NAME -n 50"; }

# ── STEP 8: Update Nginx ─────────────────────────────────────
echo ""
echo "[8/8] Updating Nginx config..."

cat > /etc/nginx/sites-available/theceo << 'NGINXEOF'
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name theceoinfluencers.com www.theceoinfluencers.com;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name theceoinfluencers.com www.theceoinfluencers.com;

    ssl_certificate     /etc/letsencrypt/live/theceoinfluencers.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/theceoinfluencers.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 200M;

    # Django static files
    location /static/ {
        alias RELEASE_DIR_PLACEHOLDER/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Django media / uploads
    location /uploads/ {
        alias RELEASE_DIR_PLACEHOLDER/backend/uploads/;
        expires 7d;
    }

    # Django API + admin + WebSocket
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # React frontend (SPA)
    location / {
        root RELEASE_DIR_PLACEHOLDER/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        expires -1;
    }
}
NGINXEOF

# Replace the placeholder with the actual path
sed -i "s|RELEASE_DIR_PLACEHOLDER|$RELEASE_DIR|g" /etc/nginx/sites-available/theceo

# Enable (already linked but ensure it)
ln -sf /etc/nginx/sites-available/theceo /etc/nginx/sites-enabled/theceo
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx && echo "      ✅ Nginx updated & reloaded" || \
    echo "      ❌ Nginx config error — run: nginx -t"

# ── DONE ────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  ✅ Deployment Complete!"
echo "============================================================"
echo ""
echo "  🌐 Frontend : https://theceoinfluencers.com"
echo "  🔧 Admin    : https://theceoinfluencers.com/admin/"
echo "  📊 API      : https://theceoinfluencers.com/api/"
echo ""
echo "  📋 Check service logs:"
echo "     journalctl -u theceo_backend -f"
echo ""
echo "  📋 Check nginx logs:"
echo "     tail -f /var/log/nginx/error.log"
echo ""
