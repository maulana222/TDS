import * as XLSX from 'xlsx';
import { validateCustomerNumber, normalizeCustomerNumber } from '../utils/customerNumber.js';

// Konstanta validasi
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

/**
 * Validasi file Excel
 * @param {File} file - File yang akan divalidasi
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateExcelFile(file) {
  // Validasi file ada
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan' };
  }

  // Validasi ukuran file
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      error: `Ukuran file terlalu besar (${sizeMB}MB). Maksimal 10MB` 
    };
  }

  // Validasi extension
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return { 
      valid: false, 
      error: `Format file tidak didukung. Gunakan ${ALLOWED_EXTENSIONS.join(' atau ')}` 
    };
  }

  // Validasi MIME type (optional, karena browser bisa salah detect)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Warning saja, tidak reject karena browser bisa salah detect
    console.warn('MIME type tidak sesuai, tapi akan tetap diproses');
  }

  return { valid: true };
}

/**
 * Parse Excel file dan extract data transaksi dengan validasi lengkap
 * @param {File} file - File Excel yang diupload
 * @returns {Promise<Object>} { transactions: Array, preview: Array }
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    // Validasi file
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Validasi workbook tidak kosong
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('File Excel tidak memiliki sheet'));
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Validasi data tidak kosong
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('File Excel tidak memiliki data. Pastikan ada data di baris 2 dan seterusnya'));
          return;
        }

        // Validasi kolom required
        const firstRow = jsonData[0];
        const hasCustomerNumber = firstRow['Customer Number'] !== undefined || 
                                   firstRow['customer_no'] !== undefined ||
                                   firstRow['Customer Number'] !== undefined;
        const hasProductCode = firstRow['Product Code'] !== undefined || 
                              firstRow['product_code'] !== undefined ||
                              firstRow['Product Code'] !== undefined;

        if (!hasCustomerNumber || !hasProductCode) {
          reject(new Error('Kolom "Customer Number" dan "Product Code" tidak ditemukan. Pastikan menggunakan template yang benar'));
          return;
        }

        // Validasi dan format data
        const transactions = [];
        const errors = [];
        const customerNumbers = new Set(); // Untuk deteksi duplikasi

        jsonData.forEach((row, index) => {
          const customerNoRaw = String(row['Customer Number'] || row['customer_no'] || row['Customer Number'] || '').trim();
          const productCode = String(row['Product Code'] || row['product_code'] || row['Product Code'] || '').trim();
          const rowNumber = index + 2;

          // Validasi data tidak kosong
          if (!customerNoRaw || !productCode) {
            errors.push(`Baris ${rowNumber}: Customer Number atau Product Code kosong`);
            return;
          }

          // Validasi dan normalisasi customer number
          const validation = validateCustomerNumber(customerNoRaw);
          if (!validation.valid) {
            errors.push(`Baris ${rowNumber}: ${validation.error}`);
            return;
          }

          const normalizedCustomerNo = validation.normalized;

          // Deteksi duplikasi customer number (gunakan normalized untuk deteksi)
          if (customerNumbers.has(normalizedCustomerNo)) {
            errors.push(`Baris ${rowNumber}: Customer Number "${customerNoRaw}" duplikat (setelah normalisasi: ${normalizedCustomerNo})`);
            return;
          }

          customerNumbers.add(normalizedCustomerNo);

          // Simpan original dan normalized
          transactions.push({
            customer_no: customerNoRaw, // Original untuk display
            customer_no_normalized: normalizedCustomerNo, // Normalized untuk request
            product_code: productCode,
            row_number: rowNumber
          });
        });

        // Jika ada error validasi, reject dengan detail
        if (errors.length > 0) {
          reject(new Error(`Validasi gagal:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...dan ${errors.length - 5} error lainnya` : ''}`));
          return;
        }

        // Buat preview data (maksimal 10 baris)
        const preview = transactions.slice(0, 10).map((t, idx) => ({
          no: idx + 1,
          customer_no: t.customer_no, // Original
          customer_no_normalized: t.customer_no_normalized, // Normalized untuk request
          product_code: t.product_code
        }));

        // Buat semua data untuk preview lengkap
        const allData = transactions.map((t, idx) => ({
          no: idx + 1,
          customer_no: t.customer_no, // Original
          customer_no_normalized: t.customer_no_normalized, // Normalized untuk request
          product_code: t.product_code
        }));

        resolve({
          transactions,
          preview,
          allData,
          totalRows: transactions.length,
          fileName: file.name,
          fileSize: file.size
        });
      } catch (error) {
        reject(new Error(`Error parsing file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error membaca file. File mungkin corrupt atau tidak dapat dibaca'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download template Excel (generate on-the-fly)
 */
export function downloadTemplate() {
  // Generate template Excel langsung di client
  const templateData = [
    {
      'No': 1,
      'Customer Number': '681208532121',
      'Product Code': 'MLK24'
    },
    {
      'No': 2,
      'Customer Number': '681208532122',
      'Product Code': 'MLK24'
    },
    {
      'No': 3,
      'Customer Number': '681208532123',
      'Product Code': 'MLK24'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 20 },  // Customer Number
    { wch: 15 }   // Product Code
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, 'transaction-template.xlsx');
}

/**
 * Export transaction results ke Excel
 * @param {Array} results - Array hasil transaksi
 * @param {string} filename - Nama file output
 */
export function exportToExcel(results, filename = 'transaction-results.xlsx') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(results);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 10 },  // No
    { wch: 20 },  // Customer Number
    { wch: 15 },  // Product Code
    { wch: 25 },  // Ref ID
    { wch: 15 },  // Status
    { wch: 10 },  // RC
    { wch: 15 },  // Balance
    { wch: 15 },  // Price
    { wch: 30 },  // SN
    { wch: 50 },  // Message
    { wch: 20 }   // Timestamp
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  XLSX.writeFile(wb, filename);
}

