import {
  deleteAllTransactions,
  deleteTransactionsByDateRange,
  deleteAllBatches,
  deleteTransactionById
} from '../models/transactionModel.js';
import { createLog } from './logController.js';
import pool from '../config/database.js';

/**
 * Delete all transactions for current user
 */
export const deleteAllTransactionsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete all batches first (due to foreign key constraint)
    await deleteAllBatches(userId);
    
    // Delete all transactions
    const deletedCount = await deleteAllTransactions(userId);
    
    // Log the deletion
    try {
      await createLog({
        user_id: userId,
        log_type: 'transaction_request',
        direction: 'outgoing',
        method: 'DELETE',
        endpoint: '/api/delete/transactions',
        request_body: { action: 'delete_all' },
        response_body: { deleted_count: deletedCount },
        status_code: 200,
        ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        user_agent: req.get('user-agent')
      });
    } catch (logError) {
      console.error('Error saving delete log:', logError);
    }
    
    res.json({
      success: true,
      message: `Berhasil menghapus ${deletedCount} transaksi`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete transactions by date range
 */
export const deleteTransactionsByDateHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.body;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date dan end_date harus diisi'
      });
    }
    
    // Delete batches in date range first
    // Note: We need to find batches that have transactions in this date range
    // For simplicity, we'll delete transactions first, then clean up orphaned batches
    
    const deletedCount = await deleteTransactionsByDateRange(userId, start_date, end_date);
    
    // Clean up orphaned batches (batches with no transactions)
    try {
      await pool.execute(
        `DELETE FROM transaction_batches 
         WHERE user_id = ? 
         AND batch_id NOT IN (
           SELECT DISTINCT batch_id FROM transactions WHERE user_id = ? AND batch_id IS NOT NULL
         )`,
        [userId, userId]
      );
    } catch (batchError) {
      console.error('Error cleaning up batches:', batchError);
      // Continue even if batch cleanup fails
    }
    
    // Log the deletion
    try {
      await createLog({
        user_id: userId,
        log_type: 'transaction_request',
        direction: 'outgoing',
        method: 'DELETE',
        endpoint: '/api/delete/transactions/date-range',
        request_body: { start_date, end_date },
        response_body: { deleted_count: deletedCount },
        status_code: 200,
        ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        user_agent: req.get('user-agent')
      });
    } catch (logError) {
      console.error('Error saving delete log:', logError);
    }
    
    res.json({
      success: true,
      message: `Berhasil menghapus ${deletedCount} transaksi`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting transactions by date:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete single transaction by ID
 */
export const deleteTransactionByIdHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID harus diisi'
      });
    }
    
    const deletedCount = await deleteTransactionById(id, userId);
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan atau tidak memiliki akses'
      });
    }
    
    // Log the deletion
    try {
      await createLog({
        user_id: userId,
        log_type: 'transaction_request',
        direction: 'outgoing',
        method: 'DELETE',
        endpoint: `/api/delete/transactions/${id}`,
        request_body: { transaction_id: id },
        response_body: { deleted_count: deletedCount },
        status_code: 200,
        ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        user_agent: req.get('user-agent')
      });
    } catch (logError) {
      console.error('Error saving delete log:', logError);
    }
    
    res.json({
      success: true,
      message: 'Berhasil menghapus transaksi',
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus transaksi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

