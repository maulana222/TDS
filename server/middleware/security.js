/**
 * Security middleware untuk sanitize dan validasi input
 */

/**
 * Sanitize string input - remove dangerous characters
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and > untuk mencegah XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize object - recursively sanitize all string values
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

/**
 * Middleware untuk sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Check untuk SQL injection patterns (basic check)
 * Note: Prepared statements sudah mencegah SQL injection, ini hanya extra layer
 */
export const checkSQLInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /[';]|--|\/\*|\*\/|\+|\%/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(value));
};

