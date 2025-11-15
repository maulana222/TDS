import { body, validationResult } from 'express-validator';

/**
 * Validation middleware untuk login
 */
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username harus diisi')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus antara 3-50 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh berisi huruf, angka, dan underscore')
    .escape(), // Sanitize untuk mencegah XSS
  
  body('password')
    .notEmpty()
    .withMessage('Password harus diisi')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password harus antara 6-100 karakter')
];

/**
 * Middleware untuk handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

