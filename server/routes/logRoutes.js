import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getLogsHandler,
  getLogByIdHandler,
  getLogStatsHandler,
  createLogHandler,
  deleteAllLogsHandler
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

// Delete all logs (user's own logs, or all logs if admin)
// HARUS ditempatkan SEBELUM route dengan parameter :id
router.delete('/', deleteAllLogsHandler);

// Get log by ID (harus di bawah route delete untuk menghindari konflik)
router.get('/:id', getLogByIdHandler);

export default router;

