import express from 'express';
import { login, verifyToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin, handleValidationErrors } from '../middleware/validation.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Login route dengan validasi dan rate limiting
router.post('/login', 
  loginRateLimiter, // Rate limiting untuk mencegah brute force
  validateLogin,     // Validasi input
  handleValidationErrors, // Handle validation errors
  login
);

// Verify token route
router.get('/verify', authenticateToken, verifyToken);

export default router;

