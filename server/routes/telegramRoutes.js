import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sendTelegramMessage } from '../controllers/telegramController.js';

const router = express.Router();

// Semua route memerlukan authentication
router.use(authenticateToken);

// Send message
router.post('/send', sendTelegramMessage);

export default router;

