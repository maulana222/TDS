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
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

