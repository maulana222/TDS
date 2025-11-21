import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSettingsHandler,
  saveSettingsHandler,
  resetSettingsHandler
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user settings
router.get('/', getSettingsHandler);

// Save user settings
router.put('/', saveSettingsHandler);

// Reset user settings
router.post('/reset', resetSettingsHandler);

export default router;


