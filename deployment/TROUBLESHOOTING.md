# Troubleshooting Nginx 500 Error

## Error: 500 Internal Server Error

### 1. Cek Error Log Nginx

```bash
# Lihat error log detail
tail -f /var/log/nginx/tds-error.log
tail -f /var/log/nginx/error.log
```

### 2. Cek Apakah Folder dist/ Ada

```bash
# Cek apakah folder dist ada
ls -la /root/tds/dist/

# Jika tidak ada, build frontend
cd /root/tds
npm run build
```

### 3. Cek Permission Folder

```bash
# Set permission yang benar
chown -R root:root /root/tds/dist
chmod -R 755 /root/tds/dist

# Cek permission
ls -la /root/tds/ | grep dist
```

### 4. Cek Apakah Backend Jalan

```bash
# Cek apakah backend jalan di port 3737
pm2 list
pm2 logs tds-backend

# Test backend langsung
curl http://localhost:3737/health

# Cek port
netstat -tulpn | grep 3737
```

### 5. Test Nginx Config

```bash
# Test konfigurasi
nginx -t

# Jika ada error, perbaiki lalu reload
systemctl reload nginx
```

### 6. Cek File index.html

```bash
# Pastikan index.html ada
ls -la /root/tds/dist/index.html

# Cek isi file
head -20 /root/tds/dist/index.html
```

### 7. Cek Nginx Error Detail

```bash
# Enable debug mode sementara
# Edit /etc/nginx/nginx.conf
# Tambahkan di http block:
# error_log /var/log/nginx/error.log debug;

# Reload
systemctl reload nginx

# Lihat log
tail -f /var/log/nginx/error.log
```

## Common Issues & Solutions

### Issue 1: Folder dist tidak ada
**Solution:**
```bash
cd /root/tds
npm run build
```

### Issue 2: Permission denied
**Solution:**
```bash
chown -R root:root /root/tds/dist
chmod -R 755 /root/tds/dist
```

### Issue 3: Backend tidak jalan
**Solution:**
```bash
cd /root/tds
pm2 start ecosystem.config.js
pm2 logs tds-backend
```

### Issue 4: Port 3737 sudah digunakan
**Solution:**
```bash
# Cek apa yang menggunakan port 3737
lsof -i :3737

# Kill process jika perlu
kill -9 <PID>
```

### Issue 5: Database connection error
**Solution:**
```bash
# Cek .env file
cat /root/tds/.env

# Test database connection
mysql -u root -p -e "USE tds_db; SHOW TABLES;"
```

## Quick Fix Commands

```bash
# 1. Build frontend
cd /root/tds && npm run build

# 2. Set permission
chown -R root:root /root/tds/dist && chmod -R 755 /root/tds/dist

# 3. Restart backend
pm2 restart tds-backend

# 4. Test nginx config
nginx -t

# 5. Reload nginx
systemctl reload nginx

# 6. Test website
curl http://tds.pix-ly.app
curl http://tds.pix-ly.app/health
```

## Debug Checklist

- [ ] Folder `/root/tds/dist` ada dan berisi file
- [ ] File `/root/tds/dist/index.html` ada
- [ ] Permission folder dist adalah 755
- [ ] Backend jalan dengan PM2 di port 3737
- [ ] Nginx config valid (`nginx -t` tidak error)
- [ ] Nginx sudah di-reload setelah perubahan config
- [ ] Firewall allow port 80
- [ ] Domain sudah pointing ke IP server



## Error: 500 Internal Server Error

### 1. Cek Error Log Nginx

```bash
# Lihat error log detail
tail -f /var/log/nginx/tds-error.log
tail -f /var/log/nginx/error.log
```

### 2. Cek Apakah Folder dist/ Ada

```bash
# Cek apakah folder dist ada
ls -la /root/tds/dist/

# Jika tidak ada, build frontend
cd /root/tds
npm run build
```

### 3. Cek Permission Folder

```bash
# Set permission yang benar
chown -R root:root /root/tds/dist
chmod -R 755 /root/tds/dist

# Cek permission
ls -la /root/tds/ | grep dist
```

### 4. Cek Apakah Backend Jalan

```bash
# Cek apakah backend jalan di port 3737
pm2 list
pm2 logs tds-backend

# Test backend langsung
curl http://localhost:3737/health

# Cek port
netstat -tulpn | grep 3737
```

### 5. Test Nginx Config

```bash
# Test konfigurasi
nginx -t

# Jika ada error, perbaiki lalu reload
systemctl reload nginx
```

### 6. Cek File index.html

```bash
# Pastikan index.html ada
ls -la /root/tds/dist/index.html

# Cek isi file
head -20 /root/tds/dist/index.html
```

### 7. Cek Nginx Error Detail

```bash
# Enable debug mode sementara
# Edit /etc/nginx/nginx.conf
# Tambahkan di http block:
# error_log /var/log/nginx/error.log debug;

# Reload
systemctl reload nginx

# Lihat log
tail -f /var/log/nginx/error.log
```

## Common Issues & Solutions

### Issue 1: Folder dist tidak ada
**Solution:**
```bash
cd /root/tds
npm run build
```

### Issue 2: Permission denied
**Solution:**
```bash
chown -R root:root /root/tds/dist
chmod -R 755 /root/tds/dist
```

### Issue 3: Backend tidak jalan
**Solution:**
```bash
cd /root/tds
pm2 start ecosystem.config.js
pm2 logs tds-backend
```

### Issue 4: Port 3737 sudah digunakan
**Solution:**
```bash
# Cek apa yang menggunakan port 3737
lsof -i :3737

# Kill process jika perlu
kill -9 <PID>
```

### Issue 5: Database connection error
**Solution:**
```bash
# Cek .env file
cat /root/tds/.env

# Test database connection
mysql -u root -p -e "USE tds_db; SHOW TABLES;"
```

## Quick Fix Commands

```bash
# 1. Build frontend
cd /root/tds && npm run build

# 2. Set permission
chown -R root:root /root/tds/dist && chmod -R 755 /root/tds/dist

# 3. Restart backend
pm2 restart tds-backend

# 4. Test nginx config
nginx -t

# 5. Reload nginx
systemctl reload nginx

# 6. Test website
curl http://tds.pix-ly.app
curl http://tds.pix-ly.app/health
```

## Debug Checklist

- [ ] Folder `/root/tds/dist` ada dan berisi file
- [ ] File `/root/tds/dist/index.html` ada
- [ ] Permission folder dist adalah 755
- [ ] Backend jalan dengan PM2 di port 3737
- [ ] Nginx config valid (`nginx -t` tidak error)
- [ ] Nginx sudah di-reload setelah perubahan config
- [ ] Firewall allow port 80
- [ ] Domain sudah pointing ke IP server

