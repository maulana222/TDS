# Troubleshooting Callback TDS

Panduan untuk mengecek dan memperbaiki masalah callback yang tidak diterima.

## 🔍 Checklist Troubleshooting

### 1. Cek Endpoint Callback

**URL Callback:**
```
POST http://your-server:3737/api/callback
```

**Test Endpoint (untuk verifikasi):**
```
GET http://your-server:3737/api/callback/test
```

### 2. Cek Logs Server

Jalankan server dan perhatikan console output:

```bash
npm run dev:server
```

Atau jika menggunakan PM2:
```bash
pm2 logs tds-backend
```

**Log yang harus muncul saat callback diterima:**
```
[CALLBACK] POST /api/callback from <IP>
[CALLBACK] Headers: {...}
[CALLBACK] Body: {...}
=== CALLBACK RECEIVED ===
Method: POST
Path: /api/callback
...
```

### 3. Test Callback Manual

**Menggunakan curl:**
```bash
# Test endpoint
curl http://localhost:3737/api/callback/test

# Test callback (format Digipro)
curl -X POST http://localhost:3737/api/callback \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "ref_id": "ref_123456",
      "status": "Sukses",
      "rc": "00",
      "message": "Transaksi berhasil"
    }
  }'

# Test callback (format langsung)
curl -X POST http://localhost:3737/api/callback \
  -H "Content-Type: application/json" \
  -d '{
    "ref_id": "ref_123456",
    "success": true,
    "status_code": 200,
    "response_data": {
      "rc": "00",
      "message": "Transaksi berhasil"
    }
  }'
```

**Menggunakan Postman:**
1. Method: `POST`
2. URL: `http://localhost:3737/api/callback`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "data": {
    "ref_id": "ref_123456",
    "status": "Sukses",
    "rc": "00"
  }
}
```

### 4. Masalah Umum & Solusi

#### ❌ Callback tidak masuk ke server

**Penyebab:**
- Firewall memblokir port 3737
- Server tidak running
- URL callback salah

**Solusi:**
```bash
# Cek server running
pm2 status
# atau
ps aux | grep node

# Cek port terbuka
netstat -tulpn | grep 3737
# atau
lsof -i :3737

# Test endpoint
curl http://localhost:3737/api/callback/test
```

#### ❌ CORS Error

**Penyebab:**
- CORS configuration terlalu strict
- External API tidak bisa akses endpoint

**Solusi:**
- Sudah diperbaiki di `server/server.js` - callback route allow semua origin
- Pastikan CORS middleware dipanggil sebelum route callback

#### ❌ Transaction not found (404)

**Penyebab:**
- Transaction belum tersimpan di database
- `ref_id` tidak match
- Timing issue (callback datang sebelum transaction disimpan)

**Solusi:**
- Callback controller sudah ada retry mechanism (5x dengan delay 500ms)
- Pastikan transaction disimpan SEBELUM callback dikirim
- Cek di database:
```sql
SELECT * FROM transactions WHERE ref_id = 'ref_123456';
```

#### ❌ Body kosong atau tidak ter-parse

**Penyebab:**
- Content-Type header salah
- Body parser tidak menerima format

**Solusi:**
- Pastikan external API mengirim `Content-Type: application/json`
- Cek body parser di `server/server.js`:
```javascript
app.use(express.json({ limit: '10mb' }));
```

#### ❌ Rate Limiting

**Penyebab:**
- Rate limiter memblokir callback

**Solusi:**
- Callback route sudah di-exclude dari rate limiting
- Cek di `server/middleware/rateLimiter.js` - callback route di-skip

#### ❌ Helmet Security Headers

**Penyebab:**
- Helmet memblokir request dari external API

**Solusi:**
- Sudah diperbaiki di `server/server.js`:
```javascript
crossOriginResourcePolicy: { policy: "cross-origin" }
```

### 5. Debugging Steps

#### Step 1: Cek Server Logs
```bash
# Development
npm run dev:server

# Production
pm2 logs tds-backend --lines 100
```

#### Step 2: Test Endpoint
```bash
curl http://localhost:3737/api/callback/test
```

Harus return:
```json
{
  "success": true,
  "message": "Callback endpoint is accessible",
  ...
}
```

#### Step 3: Test Callback dengan Transaction yang Ada
```bash
# 1. Buat transaction dulu (via API atau UI)
# 2. Dapatkan ref_id dari transaction
# 3. Test callback dengan ref_id tersebut

curl -X POST http://localhost:3737/api/callback \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "ref_id": "<ref_id_yang_ada>",
      "status": "Sukses",
      "rc": "00"
    }
  }'
```

#### Step 4: Cek Database
```sql
-- Cek transaction ada
SELECT id, ref_id, success, status_code, status 
FROM transactions 
WHERE ref_id = '<ref_id>';

-- Cek logs callback
SELECT * FROM logs 
WHERE log_type = 'callback_in' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 6. Format Callback yang Didukung

#### Format 1: Digipro Format (Recommended)
```json
{
  "data": {
    "ref_id": "ref_123456",
    "status": "Sukses",
    "rc": "00",
    "message": "Transaksi berhasil",
    "sn": "SN123456",
    "balance": "50000",
    "price": "10000"
  }
}
```

#### Format 2: Direct Format
```json
{
  "ref_id": "ref_123456",
  "success": true,
  "status_code": 200,
  "response_data": {
    "rc": "00",
    "message": "Transaksi berhasil"
  },
  "error_message": null,
  "raw_response": "...",
  "response_time": 500
}
```

### 7. Monitoring Callback

#### Cek Logs Callback
```sql
SELECT 
  id,
  ref_id,
  log_type,
  direction,
  status_code,
  created_at,
  error_message
FROM logs
WHERE log_type = 'callback_in'
ORDER BY created_at DESC
LIMIT 20;
```

#### Cek Transaction Updates
```sql
SELECT 
  id,
  ref_id,
  success,
  status,
  status_code,
  updated_at,
  created_at
FROM transactions
WHERE updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY updated_at DESC;
```

### 8. Production Checklist

- [ ] Port 3737 terbuka di firewall
- [ ] URL callback benar: `http://your-domain:3737/api/callback`
- [ ] Server running dan accessible
- [ ] Database connection OK
- [ ] CORS allow external API
- [ ] Rate limiting disabled untuk callback
- [ ] Logging enabled
- [ ] Test endpoint accessible: `/api/callback/test`

### 9. Contact & Support

Jika masih ada masalah:
1. Cek logs server (`pm2 logs tds-backend`)
2. Cek database transactions dan logs
3. Test dengan curl/Postman
4. Cek network/firewall configuration

---

**Last Updated:** 2024


