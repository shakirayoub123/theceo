#!/bin/bash
set -e

echo "Updating system and installing dependencies..."
apt update && apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib redis-server curl daphne

# Setup Postgres DB
echo "Setting up Database..."
sudo -u postgres psql -c "CREATE DATABASE tci_db;" || true
sudo -u postgres psql -c "CREATE USER tci_db_user WITH PASSWORD '78R3]eU\$Ke≠kDLIGCV>Ud+';" || true
sudo -u postgres psql -c "ALTER ROLE tci_db_user SET client_encoding TO 'utf8';" || true
sudo -u postgres psql -c "ALTER ROLE tci_db_user SET default_transaction_isolation TO 'read committed';" || true
sudo -u postgres psql -c "ALTER ROLE tci_db_user SET timezone TO 'UTC';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tci_db TO tci_db_user;" || true
sudo -u postgres psql -c "ALTER DATABASE tci_db OWNER TO tci_db_user;" || true

# Install PM2 for React/Node processes if needed, but we'll use Nginx to serve the build directory
npm install -g pm2 yarn

# Setup Backend Environment
echo "Setting up Python Environment..."
cd /var/www/theceo/backend

# Create production .env
cat > .env << 'ENVEOF'
SECRET_KEY=django-insecure-production-key-change-me
DEBUG=False
ALLOWED_HOSTS=72.62.251.242,localhost,127.0.0.1
DB_ENGINE=django.db.backends.postgresql
DB_NAME=tci_db
DB_USER=tci_db_user
DB_PASSWORD=78R3]eU$Ke≠kDLIGCV>Ud+
DB_HOST=127.0.0.1
DB_PORT=5432
REDIS_URL=redis://127.0.0.1:6379/1
ENVEOF

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Migrate
python manage.py makemigrations
python manage.py migrate

# Create Systemd service for backend
echo "Setting up Gunicorn/Daphne service..."
cat > /etc/systemd/system/theceo_backend.service << 'EOF'
[Unit]
Description=Gunicorn/Daphne daemon for TheCeo
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/var/www/theceo/backend
ExecStart=/var/www/theceo/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 tci_backend.asgi:application

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start theceo_backend
systemctl enable theceo_backend

# Build Frontend
echo "Building Frontend..."
cd /var/www/theceo/frontend
npm install
npm run build || true

# Setup Nginx
echo "Setting up Nginx..."
cat > /etc/nginx/sites-available/theceo << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/theceo/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /var/www/theceo/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/theceo/backend/uploads/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/theceo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "Deployment complete! Application is running on port 80."
