import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkBalanceHandler } from '../controllers/connectionController.js';

const router = express.Router();

// Semua route memerlukan authentication
router.use(authenticateToken);

// Check balance
router.post('/check-balance', checkBalanceHandler);

export default router;

