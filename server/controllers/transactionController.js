import {
  saveTransaction,
  saveTransactions,
  getTransactions,
  getTransactionStats,
  createBatch,
  updateBatch,
  getBatches,
  getTransactionByRefId,
  updateTransactionByRefId
} from '../models/transactionModel.js';
import { emitTransactionUpdate, emitBatchUpdate } from '../socket.js';
import { createLog } from './logController.js';
import { getUserSettings } from '../models/settingsModel.js';
import crypto from 'crypto';

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
      ref_id,
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
      refId: ref_id || null,
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

/**
 * Check transaction status by making request to Digiswitch
 */
export const checkStatusHandler = async (req, res) => {
  try {
    console.log('[CHECK STATUS] Request received:', {
      method: req.method,
      path: req.path,
      body: req.body,
      userId: req.user?.id
    });
    
    const userId = req.user.id;
    const { ref_ids } = req.body;

    if (!ref_ids || !Array.isArray(ref_ids) || ref_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ref_ids array is required'
      });
    }

    // Get user settings untuk API config
    const settings = await getUserSettings(userId);
    
    if (!settings.digiprosb_username || !settings.digiprosb_api_key || !settings.digiprosb_endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Digiswitch API settings tidak dikonfigurasi. Silakan set di Settings.'
      });
    }

    const results = [];

    // Check status untuk setiap ref_id
    for (const refId of ref_ids) {
      try {
        // Get transaction dari database
        const transaction = await getTransactionByRefId(refId);
        
        if (!transaction) {
          results.push({
            ref_id: refId,
            success: false,
            error: 'Transaction not found'
          });
          continue;
        }

        // Generate signature untuk request ke Digiswitch
        const signatureString = `${settings.digiprosb_username}${transaction.product_code}${transaction.customer_no_used || transaction.customer_no}${refId}${settings.digiprosb_api_key}`;
        const signature = crypto.createHash('md5').update(signatureString).digest('hex');

        // Request ke Digiswitch API
        const startTime = Date.now();
        const digiswitchResponse = await fetch(settings.digiprosb_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: settings.digiprosb_username,
            code: transaction.product_code,
            customer_no: transaction.customer_no_used || transaction.customer_no,
            ref_id: refId,
            sign: signature
          })
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await digiswitchResponse.text();
        let responseData = null;
        
        try {
          responseData = JSON.parse(responseBody);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseBody}`);
        }

        // Parse response
        const data = responseData.data || responseData;
        const isPending = data.status === 'Pending' || data.status === 'pending' || data.rc === '03';
        const isSuccess = !isPending && (data.status === 'Sukses' || data.status === 'sukses' || data.rc === '00');
        
        let statusString = data.status || 'Unknown';
        if (isPending) {
          statusString = 'Pending';
        } else if (isSuccess) {
          statusString = 'Sukses';
        } else {
          statusString = 'Gagal';
        }

        // Update transaction di database
        const updateData = {
          status_code: isSuccess ? 200 : (isPending ? 202 : 400),
          success: isSuccess,
          status: statusString,
          response_data: data,
          error_message: isSuccess ? null : (isPending ? null : (data.message || 'Transaksi Gagal')),
          raw_response: responseBody,
          response_time: responseTime
        };

        if (data.sn && isSuccess) {
          updateData.sn = data.sn;
        }

        await updateTransactionByRefId(refId, updateData);

        // Get updated transaction
        const updatedTransaction = await getTransactionByRefId(refId);
        
        // Emit update via socket
        if (updatedTransaction) {
          emitTransactionUpdate(updatedTransaction);
        }

        results.push({
          ref_id: refId,
          success: isSuccess,
          status: statusString,
          status_code: updateData.status_code,
          response_data: data,
          error_message: updateData.error_message,
          sn: data.sn || null
        });

        // Save log
        try {
          await createLog({
            user_id: userId,
            transaction_id: transaction.id,
            ref_id: refId,
            log_type: 'transaction_request',
            direction: 'outgoing',
            method: 'POST',
            endpoint: settings.digiprosb_endpoint,
            request_body: {
              username: settings.digiprosb_username,
              code: transaction.product_code,
              customer_no: transaction.customer_no_used || transaction.customer_no,
              ref_id: refId,
              sign: signature
            },
            response_body: responseData,
            request_headers: null,
            response_headers: {},
            status_code: digiswitchResponse.status,
            ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
            user_agent: req.get('user-agent'),
            error_message: isSuccess ? null : updateData.error_message,
            execution_time: responseTime
          });
        } catch (logError) {
          console.error('Error saving check status log:', logError);
        }

      } catch (error) {
        console.error(`Error checking status for ${refId}:`, error);
        results.push({
          ref_id: refId,
          success: false,
          error: error.message || 'Failed to check status'
        });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in check status handler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

