# Panduan Deployment TDS di Ubuntu VPS

## Informasi Server
- **Domain**: `tds.pix-ly.app`
- **User**: `root`
- **Lokasi Project**: `/root/tds`
- **Backend Port**: `3737`
- **Frontend**: Served via Nginx

## Langkah-langkah Deployment

### 1. Persiapan Server

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install MySQL
apt install -y mysql-server

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git (jika belum ada)
apt install -y git
```

### 2. Setup Project

```bash
# Masuk ke home directory root
cd /root

# Clone atau upload project
# Jika pakai Git:
git clone <your-repo-url> tds
# atau upload via SCP/SFTP ke /root/tds

# Masuk ke folder project
cd /root/tds

# Install dependencies
npm install --production
```

### 3. Build Frontend

```bash
# Build frontend
npm run build

# Pastikan folder dist/ sudah terbuat
ls -la dist/
```

### 4. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Di MySQL prompt:
CREATE DATABASE tds_db;
USE tds_db;
SOURCE /root/tds/database/tds_db.sql;
EXIT;
```

### 5. Setup Environment Variables

```bash
# Buat file .env
nano /root/tds/.env
```

Isi file `.env`:
```env
NODE_ENV=production
PORT=3737
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tds_db
JWT_SECRET=your_very_secure_jwt_secret_here
FRONTEND_URL=https://tds.pix-ly.app
```

**Generate JWT Secret:**
```bash
node server/scripts/generateJwtSecret.js
```

### 6. Setup Nginx

```bash
# Copy config Nginx
cp /root/tds/deployment/nginx-tds.conf /etc/nginx/sites-available/tds

# Enable site
ln -s /etc/nginx/sites-available/tds /etc/nginx/sites-enabled/

# Test konfigurasi
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 7. Jalankan Backend dengan PM2

```bash
# Masuk ke folder project
cd /root/tds

# Jalankan dengan PM2
pm2 start ecosystem.config.js

# Atau manual:
pm2 start server/server.js --name tds-backend --env production

# Setup PM2 untuk auto-start saat reboot
pm2 startup
pm2 save

# Cek status
pm2 list
pm2 logs tds-backend
```

### 8. Setup SSL dengan Let's Encrypt (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
certbot --nginx -d tds.pix-ly.app

# Certbot akan otomatis update config Nginx
# Setelah itu, uncomment bagian HTTPS di nginx-tds.conf
```

### 9. Firewall Setup

```bash
# Install UFW (jika belum ada)
apt install -y ufw

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Cek status
ufw status
```

## Perintah Maintenance

### PM2 Commands
```bash
pm2 list                    # Lihat semua proses
pm2 logs tds-backend       # Lihat logs backend
pm2 restart tds-backend    # Restart backend
pm2 stop tds-backend       # Stop backend
pm2 delete tds-backend     # Hapus dari PM2
pm2 monit                  # Monitor real-time
```

### Nginx Commands
```bash
systemctl status nginx     # Status Nginx
systemctl restart nginx    # Restart Nginx
systemctl reload nginx     # Reload config (tanpa downtime)
nginx -t                   # Test konfigurasi
tail -f /var/log/nginx/tds-access.log   # Lihat access log
tail -f /var/log/nginx/tds-error.log    # Lihat error log
```

### Update Deployment
```bash
# Masuk ke folder project
cd /root/tds

# Pull update (jika pakai Git)
git pull

# Install dependencies baru (jika ada)
npm install --production

# Rebuild frontend
npm run build

# Restart backend
pm2 restart tds-backend

# Reload Nginx (jika ada perubahan config)
systemctl reload nginx
```

## Troubleshooting

### Backend tidak jalan
```bash
# Cek logs
pm2 logs tds-backend

# Cek apakah port 3737 sudah digunakan
netstat -tulpn | grep 3737

# Cek environment variables
cat /root/tds/.env
```

### Nginx error
```bash
# Test config
nginx -t

# Cek error log
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/tds-error.log
```

### Database connection error
```bash
# Test koneksi MySQL
mysql -u root -p -e "USE tds_db; SHOW TABLES;"

# Cek .env file
cat /root/tds/.env | grep DB_
```

## Struktur Folder

```
/root/tds/
├── server/              # Backend code
├── dist/                # Frontend build (hasil npm run build)
├── node_modules/        # Dependencies
├── package.json
├── ecosystem.config.js  # PM2 config
├── .env                 # Environment variables
└── deployment/          # Deployment files
    └── nginx-tds.conf   # Nginx config
```

## Checklist Deployment

- [ ] Node.js dan NPM terinstall
- [ ] MySQL terinstall dan database dibuat
- [ ] Project di-clone/upload ke `/root/tds`
- [ ] Dependencies terinstall (`npm install --production`)
- [ ] Frontend sudah di-build (`npm run build`)
- [ ] File `.env` sudah dibuat dan dikonfigurasi
- [ ] Database sudah di-import
- [ ] Nginx config sudah di-copy dan di-enable
- [ ] Backend jalan dengan PM2
- [ ] PM2 sudah di-setup untuk auto-start
- [ ] Nginx sudah di-reload
- [ ] Firewall sudah dikonfigurasi
- [ ] SSL certificate sudah di-setup (opsional)
- [ ] Domain sudah pointing ke IP server

## Testing

```bash
# Test backend langsung
curl http://localhost:3737/health

# Test via domain
curl http://tds.pix-ly.app/health

# Test frontend
curl http://tds.pix-ly.app

# Test API
curl http://tds.pix-ly.app/api/health
```



## Informasi Server
- **Domain**: `tds.pix-ly.app`
- **User**: `root`
- **Lokasi Project**: `/root/tds`
- **Backend Port**: `3737`
- **Frontend**: Served via Nginx

## Langkah-langkah Deployment

### 1. Persiapan Server

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install MySQL
apt install -y mysql-server

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git (jika belum ada)
apt install -y git
```

### 2. Setup Project

```bash
# Masuk ke home directory root
cd /root

# Clone atau upload project
# Jika pakai Git:
git clone <your-repo-url> tds
# atau upload via SCP/SFTP ke /root/tds

# Masuk ke folder project
cd /root/tds

# Install dependencies
npm install --production
```

### 3. Build Frontend

```bash
# Build frontend
npm run build

# Pastikan folder dist/ sudah terbuat
ls -la dist/
```

### 4. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Di MySQL prompt:
CREATE DATABASE tds_db;
USE tds_db;
SOURCE /root/tds/database/tds_db.sql;
EXIT;
```

### 5. Setup Environment Variables

```bash
# Buat file .env
nano /root/tds/.env
```

Isi file `.env`:
```env
NODE_ENV=production
PORT=3737
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tds_db
JWT_SECRET=your_very_secure_jwt_secret_here
FRONTEND_URL=https://tds.pix-ly.app
```

**Generate JWT Secret:**
```bash
node server/scripts/generateJwtSecret.js
```

### 6. Setup Nginx

```bash
# Copy config Nginx
cp /root/tds/deployment/nginx-tds.conf /etc/nginx/sites-available/tds

# Enable site
ln -s /etc/nginx/sites-available/tds /etc/nginx/sites-enabled/

# Test konfigurasi
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 7. Jalankan Backend dengan PM2

```bash
# Masuk ke folder project
cd /root/tds

# Jalankan dengan PM2
pm2 start ecosystem.config.js

# Atau manual:
pm2 start server/server.js --name tds-backend --env production

# Setup PM2 untuk auto-start saat reboot
pm2 startup
pm2 save

# Cek status
pm2 list
pm2 logs tds-backend
```

### 8. Setup SSL dengan Let's Encrypt (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
certbot --nginx -d tds.pix-ly.app

# Certbot akan otomatis update config Nginx
# Setelah itu, uncomment bagian HTTPS di nginx-tds.conf
```

### 9. Firewall Setup

```bash
# Install UFW (jika belum ada)
apt install -y ufw

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Cek status
ufw status
```

## Perintah Maintenance

### PM2 Commands
```bash
pm2 list                    # Lihat semua proses
pm2 logs tds-backend       # Lihat logs backend
pm2 restart tds-backend    # Restart backend
pm2 stop tds-backend       # Stop backend
pm2 delete tds-backend     # Hapus dari PM2
pm2 monit                  # Monitor real-time
```

### Nginx Commands
```bash
systemctl status nginx     # Status Nginx
systemctl restart nginx    # Restart Nginx
systemctl reload nginx     # Reload config (tanpa downtime)
nginx -t                   # Test konfigurasi
tail -f /var/log/nginx/tds-access.log   # Lihat access log
tail -f /var/log/nginx/tds-error.log    # Lihat error log
```

### Update Deployment
```bash
# Masuk ke folder project
cd /root/tds

# Pull update (jika pakai Git)
git pull

# Install dependencies baru (jika ada)
npm install --production

# Rebuild frontend
npm run build

# Restart backend
pm2 restart tds-backend

# Reload Nginx (jika ada perubahan config)
systemctl reload nginx
```

## Troubleshooting

### Backend tidak jalan
```bash
# Cek logs
pm2 logs tds-backend

# Cek apakah port 3737 sudah digunakan
netstat -tulpn | grep 3737

# Cek environment variables
cat /root/tds/.env
```

### Nginx error
```bash
# Test config
nginx -t

# Cek error log
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/tds-error.log
```

### Database connection error
```bash
# Test koneksi MySQL
mysql -u root -p -e "USE tds_db; SHOW TABLES;"

# Cek .env file
cat /root/tds/.env | grep DB_
```

## Struktur Folder

```
/root/tds/
├── server/              # Backend code
├── dist/                # Frontend build (hasil npm run build)
├── node_modules/        # Dependencies
├── package.json
├── ecosystem.config.js  # PM2 config
├── .env                 # Environment variables
└── deployment/          # Deployment files
    └── nginx-tds.conf   # Nginx config
```

## Checklist Deployment

- [ ] Node.js dan NPM terinstall
- [ ] MySQL terinstall dan database dibuat
- [ ] Project di-clone/upload ke `/root/tds`
- [ ] Dependencies terinstall (`npm install --production`)
- [ ] Frontend sudah di-build (`npm run build`)
- [ ] File `.env` sudah dibuat dan dikonfigurasi
- [ ] Database sudah di-import
- [ ] Nginx config sudah di-copy dan di-enable
- [ ] Backend jalan dengan PM2
- [ ] PM2 sudah di-setup untuk auto-start
- [ ] Nginx sudah di-reload
- [ ] Firewall sudah dikonfigurasi
- [ ] SSL certificate sudah di-setup (opsional)
- [ ] Domain sudah pointing ke IP server

## Testing

```bash
# Test backend langsung
curl http://localhost:3737/health

# Test via domain
curl http://tds.pix-ly.app/health

# Test frontend
curl http://tds.pix-ly.app

# Test API
curl http://tds.pix-ly.app/api/health
```

