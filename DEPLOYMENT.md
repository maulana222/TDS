# Panduan Deployment TDS

Panduan lengkap untuk deploy aplikasi TDS ke production/development server.

## 📋 Daftar Isi

1. [Persiapan Server](#persiapan-server)
2. [Setup Database](#setup-database)
3. [Setup Environment Variables](#setup-environment-variables)
4. [Build & Deploy Frontend](#build--deploy-frontend)
5. [Setup Backend Server](#setup-backend-server)
6. [Setup Process Manager (PM2)](#setup-process-manager-pm2)
7. [Setup Nginx (Reverse Proxy)](#setup-nginx-reverse-proxy)
8. [Setup SSL/HTTPS](#setup-sslhttps)
9. [Monitoring & Logs](#monitoring--logs)
10. [Troubleshooting](#troubleshooting)

---

## 🖥️ Persiapan Server

### Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Node.js**: v18.x atau lebih baru
- **MySQL**: 8.0 atau lebih baru
- **Nginx**: (opsional, untuk reverse proxy)
- **PM2**: (untuk process management)

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx (opsional)
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

### Verifikasi Installasi

```bash
node --version    # Harus v18.x atau lebih baru
npm --version
mysql --version
pm2 --version
```

---

## 🗄️ Setup Database

### 1. Buat Database & User

```bash
# Login ke MySQL
sudo mysql -u root -p

# Di dalam MySQL console:
CREATE DATABASE tds_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tds_user'@'localhost' IDENTIFIED BY 'PASSWORD_YANG_KUAT';
GRANT ALL PRIVILEGES ON tds_db.* TO 'tds_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Import Database Schema

```bash
# Masuk ke direktori project
cd /path/to/tds

# Import schema dasar
mysql -u tds_user -p tds_db < server/config/db.sql

# Jalankan migrations
mysql -u tds_user -p tds_db < server/config/migrations/add_role_system.sql
mysql -u tds_user -p tds_db < server/config/migrations/add_role_id_to_users.sql
mysql -u tds_user -p tds_db < server/config/migrations/add_status_to_transactions.sql
mysql -u tds_user -p tds_db < server/config/migrations/add_sn_to_transactions.sql
mysql -u tds_user -p tds_db < server/config/migrations/add_telegram_bot_token.sql
```

### 3. Buat User Admin Pertama

```bash
# Setelah setup environment variables (lihat bagian berikutnya)
npm run create-user:admin -- --username admin --password Admin123! --role admin
```

---

## ⚙️ Setup Environment Variables

### 1. Buat File `.env` di Root Project

```bash
cd /path/to/tds
cp .env.example .env  # Jika ada, atau buat manual
nano .env
```

### 2. Isi File `.env` dengan Konfigurasi:

```env
# Server Configuration
PORT=3737
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=tds_user
DB_PASSWORD=PASSWORD_YANG_KUAT
DB_NAME=tds_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=GENERATE_SECRET_KEY_YANG_SANGAT_AMAN_DAN_PANJANG
JWT_EXPIRES_IN=24h

# Frontend URL (untuk CORS)
FRONTEND_URL=https://yourdomain.com
# Atau untuk development:
# FRONTEND_URL=http://localhost:8888

# Callback Secret (untuk verifikasi callback dari external API)
CALLBACK_SECRET=SECRET_KEY_UNTUK_CALLBACK_VERIFICATION

# Digiprosb API Configuration (default, bisa diubah via Settings)
DIGIPROSB_ENDPOINT=https://digiprosb.api.digiswitch.id/v1/user/api/transaction
DIGIPROSB_USERNAME=your_username
DIGIPROSB_API_KEY=your_api_key

# Telegram Bot Token (opsional, untuk Telegram Tools)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=https://yourdomain.com
# Atau untuk development:
# SOCKET_IO_CORS_ORIGIN=http://localhost:8888
```

### 3. Generate JWT Secret

```bash
# Gunakan script yang sudah ada
node server/scripts/generateJwtSecret.js

# Atau generate manual:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set Permissions

```bash
chmod 600 .env  # Hanya owner yang bisa read/write
```

---

## 🏗️ Build & Deploy Frontend

### 1. Install Dependencies

```bash
cd /path/to/tds
npm install
```

### 2. Update Vite Config untuk Production

Edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Set true jika perlu debugging di production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['react-apexcharts', 'apexcharts'],
        },
      },
    },
  },
  // Hapus proxy di production, gunakan Nginx
  server: process.env.NODE_ENV === 'development' ? {
    port: 8888,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3737',
        changeOrigin: true,
      },
    },
  } : undefined,
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:3737'
    ),
  },
});
```

### 3. Build Frontend

```bash
# Set environment variable untuk build
export VITE_API_URL=https://yourdomain.com/api
# Atau untuk development:
# export VITE_API_URL=http://localhost:3737

# Build
npm run build

# Hasil build ada di folder `dist/`
```

### 4. Deploy Frontend Files

**Opsi A: Serve via Nginx (Recommended)**

```bash
# Copy files ke Nginx directory
sudo cp -r dist/* /var/www/tds/

# Set permissions
sudo chown -R www-data:www-data /var/www/tds
sudo chmod -R 755 /var/www/tds
```

**Opsi B: Serve via Express (Simple)**

Backend akan serve static files dari folder `dist/` (lihat bagian Backend Setup).

---

## 🚀 Setup Backend Server

### 1. Update `server/server.js` untuk Serve Static Files

Pastikan di `server/server.js` ada:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files dari dist (production)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // Serve index.html untuk semua routes (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
```

### 2. Test Backend

```bash
# Test koneksi database
node -e "
import pool from './server/config/database.js';
pool.execute('SELECT 1').then(() => {
  console.log('Database connected!');
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err);
  process.exit(1);
});
"

# Test server
npm run dev:server
# Buka http://localhost:3737/api/auth/verify (harus return error karena belum login)
```

---

## 🔄 Setup Process Manager (PM2)

### 1. Buat File `ecosystem.config.js`

```bash
cd /path/to/tds
nano ecosystem.config.js
```

Isi dengan:

```javascript
export default {
  apps: [{
    name: 'tds-backend',
    script: 'server/server.js',
    instances: 1, // Atau 'max' untuk cluster mode
    exec_mode: 'fork', // Atau 'cluster' untuk load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 3737,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false, // Set true untuk development
    ignore_watch: ['node_modules', 'logs', 'dist'],
  }],
};
```

### 2. Buat Folder Logs

```bash
mkdir -p logs
```

### 3. Start dengan PM2

```bash
# Start aplikasi
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 untuk auto-start saat boot
pm2 startup
# Jalankan command yang di-output oleh pm2 startup

# Status
pm2 status

# Logs
pm2 logs tds-backend

# Monitor
pm2 monit
```

### 4. PM2 Commands

```bash
# Restart
pm2 restart tds-backend

# Stop
pm2 stop tds-backend

# Delete
pm2 delete tds-backend

# Reload (zero-downtime)
pm2 reload tds-backend
```

---

## 🌐 Setup Nginx (Reverse Proxy)

### 1. Buat Nginx Config

```bash
sudo nano /etc/nginx/sites-available/tds
```

Isi dengan:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (lihat bagian SSL Setup)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client Max Body Size (untuk upload file Excel)
    client_max_body_size 10M;

    # Frontend (Static Files)
    root /var/www/tds;
    index index.html;

    # API & Socket.IO Proxy
    location /api {
        proxy_pass http://localhost:3737;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3737;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend (SPA Routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Assets Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/tds /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Setup SSL/HTTPS

### Menggunakan Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL Certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (sudah otomatis setup)
sudo certbot renew --dry-run
```

### Manual SSL (Jika punya certificate sendiri)

```bash
# Copy certificate files
sudo cp your-cert.crt /etc/ssl/certs/tds.crt
sudo cp your-key.key /etc/ssl/private/tds.key

# Update Nginx config dengan path certificate
```

---

## 📊 Monitoring & Logs

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 info tds-backend

# Memory usage
pm2 list
```

### 2. Application Logs

```bash
# PM2 logs
pm2 logs tds-backend

# Application logs (jika ada)
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Database Logs

```bash
# MySQL error log
sudo tail -f /var/log/mysql/error.log

# MySQL slow query log (jika enabled)
sudo tail -f /var/log/mysql/slow-query.log
```

### 4. System Resources

```bash
# CPU & Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn | grep :3737
```

---

## 🔧 Troubleshooting

### Backend tidak bisa start

```bash
# Check port sudah digunakan
sudo lsof -i :3737
# atau
sudo netstat -tulpn | grep 3737

# Check database connection
mysql -u tds_user -p tds_db -e "SELECT 1;"

# Check environment variables
pm2 env tds-backend

# Check logs
pm2 logs tds-backend --lines 100
```

### Frontend tidak load

```bash
# Check Nginx config
sudo nginx -t

# Check file permissions
ls -la /var/www/tds/

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Database connection error

```bash
# Test connection
mysql -u tds_user -p tds_db

# Check MySQL service
sudo systemctl status mysql

# Check firewall
sudo ufw status
```

### Socket.IO tidak connect

```bash
# Check CORS configuration di .env
# Pastikan SOCKET_IO_CORS_ORIGIN sesuai dengan domain

# Check Nginx proxy untuk /socket.io
# Pastikan Upgrade header sudah benar
```

### Rate limiting terlalu ketat

```bash
# Edit server/middleware/rateLimiter.js
# Atau disable untuk development
```

---

## ✅ Deployment Checklist

- [ ] Server dependencies terinstall (Node.js, MySQL, Nginx, PM2)
- [ ] Database dibuat dan schema di-import
- [ ] Environment variables sudah di-set dengan benar
- [ ] JWT_SECRET sudah di-generate
- [ ] Frontend sudah di-build (`npm run build`)
- [ ] Backend bisa start tanpa error
- [ ] PM2 sudah setup dan aplikasi running
- [ ] Nginx sudah dikonfigurasi dan reload
- [ ] SSL certificate sudah di-setup
- [ ] Firewall sudah dikonfigurasi (buka port 80, 443)
- [ ] User admin pertama sudah dibuat
- [ ] Test login dan akses aplikasi
- [ ] Test API endpoints
- [ ] Test Socket.IO connection
- [ ] Monitoring dan logs sudah di-setup

---

## 🚀 Quick Start (Development)

Untuk development lokal:

```bash
# 1. Install dependencies
npm install

# 2. Setup database
mysql -u root -p < server/config/db.sql
# Jalankan migrations

# 3. Copy .env.example ke .env dan isi

# 4. Start development server
npm run dev:all
# Atau terpisah:
# Terminal 1: npm run dev:server
# Terminal 2: npm run dev
```

---

## 📝 Notes

- **Security**: Pastikan `.env` file tidak di-commit ke git
- **Backup**: Lakukan backup database secara berkala
- **Updates**: Update dependencies secara berkala untuk security patches
- **Monitoring**: Setup monitoring tools seperti PM2 Plus atau custom monitoring
- **Backup**: Setup automated backup untuk database

---

## 🆘 Support

Jika ada masalah, check:
1. Logs (PM2, Nginx, MySQL)
2. Environment variables
3. Database connection
4. Firewall rules
5. Nginx configuration

---

**Selamat Deploy! 🎉**

