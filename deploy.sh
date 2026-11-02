#!/usr/bin/env bash

# ------------------------------------------------------------
# Deploy TheCeo project to a Linux server (IP based access) without using git.
# ------------------------------------------------------------
# Prerequisites (run as root or with sudo):
#   - python3.9+ and python3-venv
#   - postgresql (or use SQLite for quick start)
#   - nginx
#   - rsync or scp to transfer the project files to the server
# ------------------------------------------------------------

# 1. Variables – adjust to your environment
PROJECT_ROOT="/opt/theceo"
LOCAL_PROJECT_PATH="/Users/shakir/Documents/TheCeo"   # Path on your local machine
PYTHON="python3"
VENV_DIR="$PROJECT_ROOT/venv"
IP_ADDRESS="$(curl -s ifconfig.me)"   # auto-detect public IP (optional)

# 2. Transfer project files to the server (run from your local machine)
#    Use rsync for efficient sync. Uncomment the line you prefer.
# rsync -avz --exclude='venv' --exclude='node_modules' "$LOCAL_PROJECT_PATH/" "$USER@$(hostname -I | awk '{print $1}'):$PROJECT_ROOT/"
# scp -r "$LOCAL_PROJECT_PATH" "$USER@$(hostname -I | awk '{print $1}'):$PROJECT_ROOT"

# 3. On the server – create project directory if it doesn't exist
sudo mkdir -p "$PROJECT_ROOT"
sudo chown $USER:$USER "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# 4. Set up Python virtual environment
$PYTHON -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# 5. Install backend and frontend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
# Frontend (React/Vite) – assumes Node is installed
cd frontend
npm ci
npm run build   # creates production assets in ./dist
cd ..

# 6. Create .env for Django (example – edit as needed)
cat > backend/.env <<EOF
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=$IP_ADDRESS
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ceoinfluencers_db
DB_USER=ceoinfluencers_user
DB_PASSWORD=YOUR_DB_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432
# If you prefer SQLite, comment out the DB_* lines and set:
# DB_ENGINE=django.db.backends.sqlite3
# DB_NAME=$PROJECT_ROOT/backend/db.sqlite3
EOF

# 7. Apply database migrations (PostgreSQL must be running & DB created)
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
cd ..

# 8. Create a systemd service for Gunicorn (backend)
sudo tee /etc/systemd/system/theceo-gunicorn.service > /dev/null <<EOT
[Unit]
Description=Gunicorn daemon for TheCeo Django backend
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_ROOT/backend
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/gunicorn tci_backend.wsgi:application \
          --workers 3 \
          --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
EOT

sudo systemctl daemon-reload
sudo systemctl enable theceo-gunicorn
sudo systemctl start theceo-gunicorn

# 9. Nginx configuration (reverse‑proxy to Gunicorn and serve static files)
sudo tee /etc/nginx/sites-available/theceo > /dev/null <<EOT
server {
    listen 80;
    server_name $IP_ADDRESS;   # IP based access

    # Static files from Django collectstatic
    location /static/ {
        alias $PROJECT_ROOT/backend/staticfiles/;
    }
    # Media uploads
    location /uploads/ {
        alias $PROJECT_ROOT/backend/uploads/;
    }
    # Frontend assets (Vite build output)
    location / {
        root $PROJECT_ROOT/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOT

sudo ln -sf /etc/nginx/sites-available/theceo /etc/nginx/sites-enabled/theceo
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Deployment completed without git! Access the app at http://$IP_ADDRESS"
