import * as XLSX from 'xlsx';

/**
 * Parse Excel file untuk marketing target
 * Format Excel:
 * - Kolom A: Username (required, format: @username atau username)
 * - Kolom B: Name (optional, nama target)
 */
export async function parseMarketingTargetExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('File Excel tidak memiliki sheet'));
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: ['username', 'name'],
          range: 1 // Skip header row
        });
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('File Excel tidak memiliki data'));
          return;
        }

        const targets = [];
        const errors = [];

        jsonData.forEach((row, index) => {
          const usernameRaw = String(row.username || '').trim();
          const name = String(row.name || '').trim();

          if (!usernameRaw) {
            errors.push(`Baris ${index + 2}: Username kosong`);
            return;
          }

          // Normalize username (add @ if not present)
          const username = usernameRaw.startsWith('@') 
            ? usernameRaw 
            : `@${usernameRaw}`;

          // Validate username format
          if (!/^@[a-zA-Z0-9_]{5,32}$/.test(username)) {
            errors.push(`Baris ${index + 2}: Format username tidak valid: ${usernameRaw}`);
            return;
          }

          targets.push({
            username,
            name
          });
        });

        if (errors.length > 0) {
          reject(new Error(`Error validasi:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... dan ${errors.length - 5} error lainnya` : ''}`));
          return;
        }

        resolve({
          targets,
          total: targets.length
        });
      } catch (error) {
        reject(new Error(`Error parsing file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download template Excel untuk marketing target
 */
export function downloadMarketingTemplate() {
  const templateData = [
    {
      'Username': '@username1',
      'Name': 'Nama Target 1'
    },
    {
      'Username': '@username2',
      'Name': 'Nama Target 2'
    },
    {
      'Username': '@username3',
      'Name': 'Nama Target 3'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Target Marketing');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Username
    { wch: 30 }  // Name
  ];

  XLSX.writeFile(workbook, 'Template_Target_Marketing.xlsx');
}

/**
 * Stopwords bahasa Indonesia yang umum digunakan
 */
const INDONESIAN_STOPWORDS = [
  'yang', 'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'dengan', 'pada', 'oleh',
  'adalah', 'akan', 'telah', 'sudah', 'belum', 'tidak', 'bukan', 'juga', 'saja',
  'ini', 'itu', 'saya', 'kamu', 'dia', 'kita', 'mereka', 'kami', 'anda',
  'ada', 'adalah', 'akan', 'bisa', 'boleh', 'harus', 'perlu', 'ingin', 'mau',
  'sangat', 'sekali', 'lebih', 'paling', 'sangat', 'amat', 'terlalu',
  'jika', 'kalau', 'apabila', 'ketika', 'saat', 'sebelum', 'sesudah',
  'karena', 'sebab', 'maka', 'jadi', 'oleh', 'karena', 'sehingga',
  'tetapi', 'namun', 'tapi', 'melainkan', 'sedangkan',
  'hal', 'halnya', 'halnya', 'hal', 'halnya',
  'dalam', 'atas', 'bawah', 'depan', 'belakang', 'samping',
  'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh',
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
  'can', 'may', 'might', 'must', 'shall'
];

/**
 * Split teks menjadi array kata dengan normalisasi dan opsi filtering
 * 
 * @param {string} text - Teks yang akan di-split
 * @param {Object} options - Opsi konfigurasi
 * @param {boolean} options.removeStopwords - Hapus stopwords (default: false)
 * @param {number} options.minLength - Panjang minimum kata (default: 1)
 * @returns {Array<string>} Array kata dalam lowercase
 * 
 * @example
 * // Basic usage
 * splitTeks("Halo, saya mau beli produk ini!")
 * // Returns: ['halo', 'saya', 'mau', 'beli', 'produk', 'ini']
 * 
 * @example
 * // Remove stopwords
 * splitTeks("Saya mau beli produk yang bagus", { removeStopwords: true })
 * // Returns: ['mau', 'beli', 'produk', 'bagus']
 * 
 * @example
 * // Minimum length
 * splitTeks("A B CD EFG", { minLength: 3 })
 * // Returns: ['cd', 'efg']
 * 
 * @example
 * // Combined options
 * splitTeks("Saya ingin beli paket premium yang diskon", { 
 *   removeStopwords: true, 
 *   minLength: 4 
 * })
 * // Returns: ['ingin', 'beli', 'paket', 'premium', 'diskon']
 */
export function splitTeks(text, options = {}) {
  // Validasi input
  if (!text || typeof text !== 'string') {
    return [];
  }

  const {
    removeStopwords = false,
    minLength = 1
  } = options;

  // 1. Normalisasi: Convert to lowercase
  let normalized = text.toLowerCase();

  // 2. Hapus tanda baca (keep alphanumeric, space, and @ for usernames)
  normalized = normalized.replace(/[^\w\s@]/g, ' ');

  // 3. Trim spasi ganda menjadi single space
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 4. Split berdasarkan spasi
  let words = normalized.split(/\s+/);

  // 5. Filter kata kosong
  words = words.filter(word => word.length > 0);

  // 6. Filter berdasarkan minLength
  if (minLength > 1) {
    words = words.filter(word => word.length >= minLength);
  }

  // 7. Remove stopwords jika diminta
  if (removeStopwords) {
    words = words.filter(word => !INDONESIAN_STOPWORDS.includes(word));
  }

  return words;
}

/**
 * Split text menjadi array kata (alias untuk backward compatibility)
 * @deprecated Gunakan splitTeks() sebagai gantinya
 */
export function splitText(text) {
  return splitTeks(text);
}

/**
 * Extract keywords dari text
 */
export function extractKeywords(text, keywordList = [], options = {}) {
  const words = splitTeks(text, options);
  const foundKeywords = [];

  keywordList.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    if (words.includes(keywordLower) || text.toLowerCase().includes(keywordLower)) {
      foundKeywords.push(keyword);
    }
  });

  return foundKeywords;
}

/**
 * Detect intent dari pesan
 */
export function detectIntent(text, rules = {}, options = {}) {
  const words = splitTeks(text, options);
  const intents = [];

  // Default rules
  const defaultRules = {
    promo: ['promo', 'diskon', 'sale', 'discount', 'hemat', 'murah'],
    beli: ['beli', 'buy', 'pesan', 'order', 'pembelian'],
    harga: ['harga', 'price', 'biaya', 'cost', 'tarif'],
    stok: ['stok', 'stock', 'tersedia', 'available', 'ada'],
    info: ['info', 'informasi', 'tanya', 'ask', 'detail'],
    ...rules
  };

  Object.keys(defaultRules).forEach(intent => {
    const keywords = defaultRules[intent];
    const found = keywords.some(keyword => 
      words.includes(keyword.toLowerCase()) || 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (found) {
      intents.push(intent);
    }
  });

  return intents;
}

