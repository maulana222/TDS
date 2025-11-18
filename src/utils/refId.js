/**
 * Generate unique reference ID
 * @returns {string} Unique ref_id dengan format gabungan huruf dan angka (contoh: r2835j9ajdso82jd)
 */
export function generateRefId() {
  // Karakter yang digunakan: huruf kecil dan angka
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 16; // Panjang ref_id
  
  let refId = '';
  
  // Generate random string
  for (let i = 0; i < length; i++) {
    refId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return refId;
}
