import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  deleteAllTransactionsHandler,
  deleteTransactionsByDateHandler,
  deleteTransactionByIdHandler
} from '../controllers/deleteController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Delete all transactions
router.delete('/transactions', deleteAllTransactionsHandler);

// Delete transactions by date range
router.delete('/transactions/date-range', deleteTransactionsByDateHandler);

// Delete single transaction by ID
router.delete('/transactions/:id', deleteTransactionByIdHandler);

export default router;

