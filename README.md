# TDS - Transaction Request Tool

Web app React untuk melakukan request transaksi secara terus menerus dengan upload Excel.

## Struktur Folder

```
TDS/
├── public/                 # Static files
│   └── index.html
├── src/                    # Source code utama
│   ├── components/         # React components
│   │   ├── ExcelUpload.jsx
│   │   ├── TransactionMonitor.jsx
│   │   └── ConfigForm.jsx
│   ├── pages/              # Pages
│   │   ├── Home.jsx
│   │   └── History.jsx
│   ├── services/           # API services & business logic
│   │   ├── api.js          # API client untuk request transaksi
│   │   ├── excelService.js # Handle upload/download Excel
│   │   └── transactionService.js # Logic transaksi
│   ├── utils/              # Helper functions
│   │   ├── signature.js    # Generate MD5 signature
│   │   ├── refId.js        # Generate ref_id
│   │   └── storage.js      # File-based storage helper
│   ├── hooks/              # Custom React hooks (optional)
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── scripts/                # Utility scripts
│   └── generateTemplate.js # Script untuk generate template Excel
├── storage/                # File-based storage
│   ├── logs/               # Transaction logs
│   ├── history/            # Transaction history (JSON)
│   └── uploads/            # Temporary uploaded files
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

## Format Excel Template

Template Excel memiliki kolom berikut:
- **No**: Nomor urut (optional)
- **Customer Number**: Nomor customer (required)
- **Product Code**: Kode produk (required)

Contoh:
| No | Customer Number | Product Code |
|----|----------------|--------------|
| 1  | 681208532121   | MLK24        |
| 2  | 681208532122   | MLK24        |

## Instalasi

```bash
npm install
```

## Setup Environment

Copy `.env.example` ke `.env` dan isi dengan konfigurasi API:

```
VITE_API_ENDPOINT=https://digiprosb.api.digiswitch.id/v1/user/api/transaction
VITE_USERNAME=your_username
VITE_API_KEY=your_api_key
```

## Menjalankan

```bash
# Development
npm run dev

# Build untuk production
npm run build

# Generate template Excel (optional)
npm run generate-template
```

## Fitur

- ✅ Upload Excel dengan multiple customer numbers
- ✅ Download template Excel (generate on-the-fly)
- ✅ Request transaksi terus menerus
- ✅ Real-time monitoring progress
- ✅ Konfigurasi delay antar request
- ✅ Export hasil ke Excel
- ✅ History transaksi (file-based storage)

## Cara Penggunaan

1. Klik "Download Template Excel" untuk mendapatkan template
2. Isi template dengan data customer number dan product code
3. Upload file Excel yang sudah diisi
4. Atur delay antar request (opsional)
5. Klik "Mulai Request" untuk memproses transaksi
6. Monitor progress dan hasil real-time
7. Export hasil ke Excel jika diperlukan

