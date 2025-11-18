# Backend Setup - TDS

## Prerequisites

1. **MySQL Database** - Pastikan MySQL sudah terinstall dan running
2. **Node.js** - Versi 14 atau lebih tinggi

## Setup Database

1. **Buat database dan tabel:**
   ```bash
   mysql -u root -p < server/config/db.sql
   ```

   Atau jalankan SQL secara manual:
   ```sql
   CREATE DATABASE IF NOT EXISTS tds_db;
   USE tds_db;
   
   CREATE TABLE IF NOT EXISTS users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(50) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   ```

2. **Buat user default:**
   ```bash
   npm run create-user admin admin123
   ```

   Atau buat user secara manual dengan password yang sudah di-hash menggunakan bcrypt.

## Environment Variables

1. **Copy `.env.example` ke `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Generate JWT Secret:**
   
   Cara umum generate JWT secret (pilih salah satu):
   
   **a. Menggunakan script helper:**
   ```bash
   npm run generate-jwt-secret
   ```
   
   **b. Menggunakan Node.js langsung:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **c. Menggunakan OpenSSL (Linux/Mac/Git Bash):**
   ```bash
   openssl rand -hex 32
   ```
   
   **d. Menggunakan PowerShell (Windows):**
   ```powershell
   -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```

3. **Edit `.env` dan sesuaikan konfigurasi:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tds_db
   
   JWT_SECRET=<paste-jwt-secret-yang-sudah-di-generate>
   PORT=3737
   FRONTEND_URL=http://localhost:8888
   VITE_API_URL=http://localhost:3737
   ```

## Menjalankan Server

### Development Mode

1. **Jalankan backend saja:**
   ```bash
   npm run dev:server
   ```

2. **Jalankan frontend saja:**
   ```bash
   npm run dev
   ```

3. **Jalankan keduanya bersamaan:**
   ```bash
   npm run dev:all
   ```

Server akan berjalan di `http://localhost:3737`

## API Endpoints

### Authentication

- **POST `/api/auth/login`**
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "success": true, "token": "...", "user": {...} }`

- **GET `/api/auth/verify`**
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ "success": true, "user": {...} }`

### Health Check

- **GET `/health`**
  - Response: `{ "success": true, "message": "Server and database are running" }`

## Membuat User Baru

Gunakan script untuk membuat user baru:

```bash
npm run create-user <username> <password>
```

Contoh:
```bash
npm run create-user admin admin123
npm run create-user user1 password123
```

## Security Notes

1. **JWT Secret**: Pastikan `JWT_SECRET` di `.env` menggunakan string yang kuat dan random
2. **Database Password**: Jangan commit file `.env` ke repository
3. **HTTPS**: Untuk production, gunakan HTTPS
4. **Password**: Gunakan password yang kuat untuk user

## Troubleshooting

### Database Connection Error

- Pastikan MySQL service running
- Cek kredensial di `.env`
- Pastikan database `snifer_db` sudah dibuat

### Port Already in Use

- Ubah `PORT` di `.env` atau
- Kill process yang menggunakan port 3737

### Connection Refused Error

Jika mendapat error `ERR_CONNECTION_REFUSED`:
1. **Pastikan backend server sudah berjalan:**
   ```bash
   npm run dev:server
   ```
   
2. **Cek apakah server berjalan di port 3737:**
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3737
   
   # Linux/Mac
   lsof -i :3737
   ```
   
3. **Pastikan file `.env` sudah dibuat dan berisi konfigurasi yang benar**


npm run create-user user1 password123
```

## Security Notes

1. **JWT Secret**: Pastikan `JWT_SECRET` di `.env` menggunakan string yang kuat dan random
2. **Database Password**: Jangan commit file `.env` ke repository
3. **HTTPS**: Untuk production, gunakan HTTPS
4. **Password**: Gunakan password yang kuat untuk user

## Troubleshooting

### Database Connection Error

- Pastikan MySQL service running
- Cek kredensial di `.env`
- Pastikan database `snifer_db` sudah dibuat

### Port Already in Use

- Ubah `PORT` di `.env` atau
- Kill process yang menggunakan port 3737

### Connection Refused Error

Jika mendapat error `ERR_CONNECTION_REFUSED`:
1. **Pastikan backend server sudah berjalan:**
   ```bash
   npm run dev:server
   ```
   
2. **Cek apakah server berjalan di port 3737:**
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3737
   
   # Linux/Mac
   lsof -i :3737
   ```
   
3. **Pastikan file `.env` sudah dibuat dan berisi konfigurasi yang benar**
