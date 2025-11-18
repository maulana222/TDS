import rateLimit from 'express-rate-limit';

/**
 * Rate limiter untuk login endpoint
 * Mencegah brute force attack
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 request per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Hanya hitung request yang gagal
});

/**
 * General API rate limiter
 * Mengecualikan callback route dari rate limiting
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 1000, // Maksimal 1000 request per 15 menit (ditingkatkan untuk proses transaksi)
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting untuk:
    // 1. Callback route (dipanggil dari external API)
    if (req.path.startsWith('/api/callback')) {
      return true;
    }
    
    // 2. Verify token route (dipanggil setiap ganti halaman)
    if (req.path.startsWith('/api/auth/verify')) {
      return true;
    }
    
    // 3. Save transactions route (dipanggil untuk setiap transaksi)
    if (req.path.startsWith('/api/transactions') && req.method === 'POST') {
      return true;
    }
    
    // 4. Save logs route (dipanggil untuk setiap transaksi)
    if (req.path.startsWith('/api/logs') && req.method === 'POST') {
      return true;
    }
    
    // 5. Update batch route (dipanggil beberapa kali saat proses)
    if (req.path.startsWith('/api/transactions/batches') && req.method === 'PUT') {
      return true;
    }
    
    return false;
  },
});

