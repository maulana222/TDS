/**
 * Normalisasi customer number ke format 08 untuk request API
 * Menerima berbagai format:
 * - 6289675732323 (62...)
 * - +62882873673 (+62...)
 * - 89786875165425 (8...)
 * - 081234567890 (08...)
 * 
 * @param {string} customerNo - Customer number dalam berbagai format
 * @returns {string} Customer number dalam format 08xxxxxxxxxx
 */
export function normalizeCustomerNumber(customerNo) {
  if (!customerNo) return '';
  
  // Hapus spasi dan karakter non-digit kecuali +
  let cleaned = customerNo.toString().trim().replace(/\s/g, '');
  
  // Jika sudah format 08, return langsung
  if (cleaned.startsWith('08')) {
    return cleaned;
  }
  
  // Handle format +62 atau 62
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.replace('+62', '0');
  } else if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('8')) {
    // Format 8xxxxxxxxx -> 08xxxxxxxxx
    cleaned = '0' + cleaned;
  }
  
  // Pastikan dimulai dengan 08
  if (!cleaned.startsWith('08')) {
    // Jika tidak dimulai dengan 08, coba tambahkan 0 di depan
    if (cleaned.startsWith('8')) {
      cleaned = '0' + cleaned;
    } else {
      // Jika tidak bisa dinormalisasi, return as is (akan gagal validasi)
      return cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Validasi format customer number
 * @param {string} customerNo - Customer number
 * @returns {Object} { valid: boolean, error?: string, normalized?: string }
 */
export function validateCustomerNumber(customerNo) {
  if (!customerNo) {
    return { valid: false, error: 'Customer number tidak boleh kosong' };
  }
  
  const cleaned = customerNo.toString().trim();
  
  // Cek apakah hanya angka, +, dan spasi
  if (!/^[\d\s+]+$/.test(cleaned)) {
    return { valid: false, error: 'Customer number hanya boleh berisi angka, +, dan spasi' };
  }
  
  // Normalisasi
  const normalized = normalizeCustomerNumber(cleaned);
  
  // Validasi format 08
  if (!normalized.startsWith('08')) {
    return { 
      valid: false, 
      error: `Format tidak valid. Harus dimulai dengan 08, 62, +62, atau 8. Ditemukan: ${cleaned}`,
      normalized 
    };
  }
  
  // Validasi panjang (minimal 10 digit, maksimal 13 digit untuk 08xxxxxxxxxx)
  if (normalized.length < 10 || normalized.length > 13) {
    return { 
      valid: false, 
      error: `Panjang customer number tidak valid (${normalized.length} digit). Harus 10-13 digit`,
      normalized 
    };
  }
  
  return { valid: true, normalized };
}

