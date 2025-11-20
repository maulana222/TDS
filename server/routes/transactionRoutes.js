import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  saveTransactionHandler,
  saveTransactionsHandler,
  getTransactionsHandler,
  getStatsHandler,
  createBatchHandler,
  updateBatchHandler,
  getBatchesHandler,
  checkStatusHandler
} from '../controllers/transactionController.js';

const router = express.Router();

// Semua route memerlukan authentication
router.use(authenticateToken);

// Batch operations
router.post('/batches', createBatchHandler);
router.get('/batches', getBatchesHandler);
router.patch('/batches/:batch_id', updateBatchHandler);

// Transaction operations
// IMPORTANT: Specific routes harus didefinisikan sebelum generic routes
router.post('/check-status', checkStatusHandler);
router.post('/bulk', saveTransactionsHandler);
router.post('/', saveTransactionHandler);
router.get('/stats', getStatsHandler);
router.get('/', getTransactionsHandler);

export default router;

