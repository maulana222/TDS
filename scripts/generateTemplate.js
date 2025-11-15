import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data template Excel
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

// Buat workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(templateData);

// Set column widths
ws['!cols'] = [
  { wch: 5 },   // No
  { wch: 20 },  // Customer Number
  { wch: 15 }   // Product Code
];

// Tambah worksheet ke workbook
XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

// Simpan file
const outputPath = join(__dirname, '..', 'templates', 'transaction-template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Template Excel berhasil dibuat di:', outputPath);

