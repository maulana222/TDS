import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getLogsHandler,
  getLogByIdHandler,
  getLogStatsHandler,
  createLogHandler
} from '../controllers/logController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create log (untuk logging dari frontend)
router.post('/', createLogHandler);

// Get logs dengan filter dan pagination
router.get('/', getLogsHandler);

// Get log statistics
router.get('/stats', getLogStatsHandler);

// Get log by ID
router.get('/:id', getLogByIdHandler);

export default router;

