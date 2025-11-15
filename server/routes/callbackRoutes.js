import express from 'express';
import { handleCallback } from '../controllers/callbackController.js';

const router = express.Router();

// Callback route tidak memerlukan authentication (dipanggil dari external API)
// POST /api/callback
router.post('/', handleCallback);

export default router;
