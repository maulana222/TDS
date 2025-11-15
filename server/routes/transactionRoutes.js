import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  saveTransactionHandler,
  saveTransactionsHandler,
  getTransactionsHandler,
  getStatsHandler,
  createBatchHandler,
  updateBatchHandler,
  getBatchesHandler
} from '../controllers/transactionController.js';

const router = express.Router();

// Semua route memerlukan authentication
router.use(authenticateToken);

// Batch operations
router.post('/batches', createBatchHandler);
router.get('/batches', getBatchesHandler);
router.patch('/batches/:batch_id', updateBatchHandler);

// Transaction operations
router.post('/', saveTransactionHandler);
router.post('/bulk', saveTransactionsHandler);
router.get('/', getTransactionsHandler);
router.get('/stats', getStatsHandler);

export default router;

