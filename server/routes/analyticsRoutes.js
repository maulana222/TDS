import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getDashboardStatsHandler,
  getStatsHandler
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics (all data)
router.get('/dashboard', getDashboardStatsHandler);

// Get transaction statistics only
router.get('/stats', getStatsHandler);

export default router;

