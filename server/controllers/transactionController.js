import {
  saveTransaction,
  saveTransactions,
  getTransactions,
  getTransactionStats,
  createBatch,
  updateBatch,
  getBatches
} from '../models/transactionModel.js';
import { emitTransactionUpdate, emitBatchUpdate } from '../socket.js';
import { createLog } from './logController.js';

/**
 * Save single transaction
 */
export const saveTransactionHandler = async (req, res) => {
  try {
    const transactionData = req.body;
    const userId = req.user.id;
    const batchId = req.body.batch_id || null;

    const transactionId = await saveTransaction(transactionData, userId, batchId);

    // Save log untuk transaction response (jika ada response data)
    if (transactionData.rawResponse) {
      try {
        await createLog({
          user_id: userId,
          transaction_id: transactionId,
          ref_id: transactionData.ref_id,
          log_type: 'transaction_response',
          direction: 'incoming',
          method: 'POST',
          endpoint: '/api/transactions',
          request_body: null,
          response_body: transactionData.data || JSON.parse(transactionData.rawResponse),
          request_headers: null,
          response_headers: {},
          status_code: transactionData.status || 200,
          ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
          user_agent: req.get('user-agent'),
          error_message: transactionData.error || null,
          execution_time: transactionData.responseTime || null
        });
      } catch (logError) {
        console.error('Error saving transaction response log:', logError);
      }
    }

    // Get saved transaction untuk emit
    const { getTransactionByRefId } = await import('../models/transactionModel.js');
    const savedTransaction = await getTransactionByRefId(transactionData.ref_id);
    if (savedTransaction) {
      emitTransactionUpdate(savedTransaction);
    }

    res.json({
      success: true,
      message: 'Transaction saved',
      transaction_id: transactionId
    });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Save multiple transactions (bulk)
 */
export const saveTransactionsHandler = async (req, res) => {
  try {
    const { transactions, batch_id } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transactions array is required'
      });
    }

    const transactionIds = await saveTransactions(transactions, userId, batch_id);

    // Emit untuk setiap transaction yang disimpan
    const { getTransactionByRefId } = await import('../models/transactionModel.js');
    for (const tx of transactions) {
      if (tx.ref_id) {
        const savedTx = await getTransactionByRefId(tx.ref_id);
        if (savedTx) {
          emitTransactionUpdate(savedTx);
        }
      }
    }

    res.json({
      success: true,
      message: `${transactions.length} transactions saved`,
      count: transactionIds.length
    });
  } catch (error) {
    console.error('Error saving transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get transactions dengan filter dan pagination
 */
export const getTransactionsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      batch_id,
      success,
      customer_no,
      product_code,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      batchId: batch_id || null,
      success: success !== undefined ? success === 'true' : null,
      customerNo: customer_no || null,
      productCode: product_code || null,
      startDate: start_date || null,
      endDate: end_date || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const transactions = await getTransactions(userId, filters, pagination);
    const stats = await getTransactionStats(userId, filters);

    res.json({
      success: true,
      data: transactions,
      stats,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: stats.total
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get transaction statistics
 */
export const getStatsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batch_id, start_date, end_date } = req.query;

    const filters = {
      batchId: batch_id || null,
      startDate: start_date || null,
      endDate: end_date || null
    };

    const stats = await getTransactionStats(userId, filters);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create transaction batch
 */
export const createBatchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batch_id, total_transactions, config } = req.body;

    if (!batch_id || !total_transactions) {
      return res.status(400).json({
        success: false,
        message: 'batch_id and total_transactions are required'
      });
    }

    const batchId = await createBatch(userId, batch_id, total_transactions, config);

    res.json({
      success: true,
      message: 'Batch created',
      batch_id: batch_id
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update batch status
 */
export const updateBatchHandler = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const updates = req.body;

    await updateBatch(batch_id, updates);

    res.json({
      success: true,
      message: 'Batch updated'
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get batches
 */
export const getBatchesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const batches = await getBatches(userId, limit);

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error getting batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

