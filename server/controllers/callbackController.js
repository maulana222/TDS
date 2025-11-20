import {
  getTransactionByRefId,
  updateTransactionByRefId,
  updateBatchStats
} from '../models/transactionModel.js';
import { emitTransactionUpdate, emitBatchUpdate } from '../socket.js';
import { createLog } from './logController.js';
import crypto from 'crypto';

/**
 * Verify callback signature (optional, jika external API mengirim signature)
 */
const verifyCallbackSignature = (data, signature, secret) => {
  if (!secret) return true; // Skip verification jika secret tidak di-set
  
  const expectedSignature = crypto
    .createHash('md5')
    .update(JSON.stringify(data) + secret)
    .digest('hex');
  
  return expectedSignature === signature;
};

/**
 * Parse callback data dari digipro format
 * Format: { data: { ref_id, status, rc, message, ... } }
 */
const parseDigiproCallback = (body) => {
  // Format digipro: { data: { ref_id, status, rc, message, ... } }
  if (body.data && body.data.ref_id) {
    const data = body.data;
    const refId = data.ref_id;
    
    // Determine success: status = "Sukses" atau rc = "00"
    // Status "Pending" atau rc "03" berarti masih pending (belum final)
    const isPending = data.status === 'Pending' || data.status === 'pending' || data.rc === '03';
    const isSuccess = !isPending && (data.status === 'Sukses' || data.status === 'sukses' || data.rc === '00');
    
    // Determine status string
    let statusString = data.status || 'Unknown';
    if (isPending) {
      statusString = 'Pending';
    } else if (isSuccess) {
      statusString = 'Sukses';
    } else {
      statusString = 'Gagal';
    }
    
    return {
      ref_id: refId,
      success: isSuccess,
      status: statusString, // Status string: Pending, Sukses, Gagal
      status_code: isSuccess ? 200 : (isPending ? 202 : 400), // 202 for pending
      response_data: data,
      error_message: isSuccess ? null : (isPending ? null : (data.message || 'Transaksi Gagal')),
      raw_response: JSON.stringify(body)
    };
  }
  
  // Fallback ke format langsung (untuk backward compatibility)
  // Determine status string dari response_data atau body
  let statusString = body.status || body.response_data?.status || 'Unknown';
  if (body.success === true) {
    statusString = 'Sukses';
  } else if (body.success === false) {
    statusString = body.response_data?.status || 'Gagal';
  }
  
  return {
    ref_id: body.ref_id,
    success: body.success,
    status: statusString, // Status string: Pending, Sukses, Gagal
    status_code: body.status_code,
    response_data: body.response_data,
    error_message: body.error_message,
    raw_response: body.raw_response || JSON.stringify(body),
    response_time: body.response_time
  };
};

/**
 * Handle callback dari external API untuk update transaction
 * 
 * Support 2 format:
 * 1. Digipro format: { data: { ref_id, status, rc, message, ... } }
 * 2. Direct format: { ref_id, success, status_code, response_data, ... }
 */
export const handleCallback = async (req, res) => {
  const callbackId = req.callbackRequestId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = req.callbackStartTime || Date.now();
  
  try {
    const body = req.body;
    
    // Logging sudah dilakukan di route level, hanya log parsing di sini
    console.log(`[CONTROLLER] Processing callback [${callbackId}]`);
    
    // Parse callback data (support digipro format)
    const parsed = parseDigiproCallback(body);
    const { ref_id, success, status_code, response_data, error_message, raw_response, response_time } = parsed;

    console.log('Parsed callback data:', {
      ref_id,
      success,
      status: parsed.status,
      status_code,
      rc: response_data?.rc,
      message: response_data?.message
    });

    // Validasi required fields
    if (!ref_id) {
      console.error('Callback rejected: ref_id is missing');
      return res.status(400).json({
        success: false,
        message: 'ref_id is required'
      });
    }

    // Cek apakah transaction ada (dengan retry jika belum ada)
    // Retry beberapa kali karena transaction mungkin masih dalam proses save
    // Optimasi: kurangi retry delay untuk response lebih cepat
    let transaction = await getTransactionByRefId(ref_id);
    let retryCount = 0;
    const maxRetries = 3; // Kurangi dari 5 ke 3
    const retryDelay = 200; // Kurangi dari 500ms ke 200ms untuk response lebih cepat
    
    console.log(`Looking for transaction ref_id: ${ref_id}, found: ${transaction ? 'YES' : 'NO'}`);
    
    while (!transaction && retryCount < maxRetries) {
      console.log(`Transaction ${ref_id} not found, retrying... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      transaction = await getTransactionByRefId(ref_id);
      retryCount++;
    }
    
    if (!transaction) {
      console.error(`Transaction ${ref_id} still not found after ${maxRetries} retries. Callback data:`, JSON.stringify(body, null, 2));
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
        ref_id: ref_id
      });
    }
    
    console.log(`Transaction found: ref_id=${ref_id}, current_status=${transaction.status}, current_success=${transaction.success}`);
    

    // Verify signature jika ada secret key di env (untuk format langsung)
    const callbackSecret = process.env.CALLBACK_SECRET;
    if (callbackSecret && body.signature) {
      const isValid = verifyCallbackSignature(
        { ref_id, status_code, success },
        body.signature,
        callbackSecret
      );
      
      if (!isValid) {
        console.warn('Invalid callback signature for ref_id:', ref_id);
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    }

    // Update transaction
    const updateData = {};
    
    if (status_code !== undefined) updateData.status_code = status_code;
    if (success !== undefined) updateData.success = success;
    if (parsed.status !== undefined) updateData.status = parsed.status; // Status string
    if (response_data !== undefined) updateData.response_data = response_data;
    if (error_message !== undefined) updateData.error_message = error_message;
    if (raw_response !== undefined) updateData.raw_response = raw_response;
    if (response_time !== undefined) updateData.response_time = response_time;
    
    // Extract sn from response_data if available and transaction is successful
    if (response_data && success && response_data.sn) {
      updateData.sn = response_data.sn;
    }

    console.log(`[CONTROLLER] Updating transaction ${ref_id}:`, {
      from: {
        status: transaction.status,
        success: transaction.success,
        status_code: transaction.status_code
      },
      to: {
        status: updateData.status,
        success: updateData.success,
        status_code: updateData.status_code
      }
    });

    // Update transaction - HARUS dilakukan sebelum response
    // Queue sudah di-handle di route level, jadi di sini langsung update
    console.log(`[CONTROLLER] About to update transaction ${ref_id} [${callbackId}]`);
    const updateStartTime = Date.now();
    const updateResult = await updateTransactionByRefId(ref_id, updateData);
    const updateTime = Date.now() - updateStartTime;
    
    console.log(`[CONTROLLER] Update result for ${ref_id} [${callbackId}]:`, {
      updated: updateResult.updated,
      affectedRows: updateResult.affectedRows || 'N/A',
      updateTime: `${updateTime}ms`
    });

    if (!updateResult.updated) {
      console.error(`[CONTROLLER] Failed to update transaction ${ref_id}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction'
      });
    }

    // Save log untuk callback yang diterima
    console.log(`[CONTROLLER] About to save callback log for ${ref_id} [${callbackId}]`);
    try {
      const logStartTime = Date.now();
      await createLog({
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        ref_id: ref_id,
        log_type: 'callback_in',
        direction: 'incoming',
        method: req.method,
        endpoint: req.path,
        request_body: body,
        response_body: { success: true, message: 'Callback processed' },
        request_headers: req.headers,
        response_headers: {},
        status_code: 200,
        ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        user_agent: req.get('user-agent'),
        error_message: error_message || null,
        execution_time: response_time || null
      });
      const logTime = Date.now() - logStartTime;
      console.log(`[CONTROLLER] Callback log saved for ${ref_id} [${callbackId}], time: ${logTime}ms`);
    } catch (logError) {
      console.error(`[CONTROLLER] Error saving callback log for ${ref_id} [${callbackId}]:`, logError);
      // Don't fail the callback if log save fails
    }

    // Update batch statistics jika ada batch_id
    if (transaction.batch_id) {
      console.log(`[CONTROLLER] About to update batch stats for batch_id: ${transaction.batch_id}, ref_id: ${ref_id} [${callbackId}]`);
      try {
        const batchStartTime = Date.now();
        await updateBatchStats(transaction.batch_id);
        const batchTime = Date.now() - batchStartTime;
        console.log(`[CONTROLLER] Batch stats updated for batch_id: ${transaction.batch_id}, ref_id: ${ref_id} [${callbackId}], time: ${batchTime}ms`);
        
        // Get updated batch untuk emit
        const { getBatches } = await import('../models/transactionModel.js');
        const batches = await getBatches(transaction.user_id, 1);
        const updatedBatch = batches.find(b => b.batch_id === transaction.batch_id);
        if (updatedBatch) {
          emitBatchUpdate(updatedBatch);
        }
      } catch (error) {
        console.error('Error updating batch stats:', error);
        // Continue even if batch update fails
      }
    }

    // Get updated transaction untuk emit (lakukan sebelum response)
    console.log(`[CONTROLLER] About to get updated transaction for emit, ref_id: ${ref_id} [${callbackId}]`);
    const emitStartTime = Date.now();
    const updatedTransaction = await getTransactionByRefId(ref_id);
    const emitGetTime = Date.now() - emitStartTime;
    
    if (updatedTransaction) {
      console.log(`[CONTROLLER] Emitting transaction update for ${ref_id} [${callbackId}]:`, {
        status: updatedTransaction.status,
        success: updatedTransaction.success,
        status_code: updatedTransaction.status_code,
        getTime: `${emitGetTime}ms`
      });
      // Emit langsung (tidak perlu setImmediate karena sudah async)
      const emitCallStart = Date.now();
      emitTransactionUpdate(updatedTransaction);
      const emitCallTime = Date.now() - emitCallStart;
      console.log(`[CONTROLLER] Emit call completed for ${ref_id} [${callbackId}], emit time: ${emitCallTime}ms`);
    } else {
      console.warn(`[CONTROLLER] Updated transaction ${ref_id} not found for emit [${callbackId}]`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`=== CALLBACK PROCESSED SUCCESSFULLY [${callbackId}] ===`);
    console.log(`ref_id: ${ref_id}, status: ${parsed.status}, success: ${success}`);
    console.log(`Processing time: ${processingTime}ms`);
    console.log('========================================\n');

    // Response dikirim SETELAH semua operasi selesai
    // Pastikan response hanya dikirim sekali dan selalu dikirim
    if (res.headersSent) {
      console.warn(`[CONTROLLER] Response already sent for ${ref_id} [${callbackId}]`);
    } else {
      try {
        res.json({
          success: true,
          message: 'Transaction updated successfully',
          ref_id
        });
        console.log(`[CONTROLLER] Response sent successfully for ${ref_id} [${callbackId}]`);
      } catch (responseError) {
        console.error(`[CONTROLLER] Error sending response for ${ref_id} [${callbackId}]:`, responseError);
      }
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`=== CALLBACK ERROR [${callbackId}] ===`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error(`Processing time before error: ${processingTime}ms`);
    console.error('========================================\n');
    
    // Pastikan response dikirim meskipun ada error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

/**
 * Handle bulk callback (multiple transactions)
 * Support digipro format dan direct format
 */
export const handleBulkCallback = async (req, res) => {
  try {
    const { transactions, data } = req.body;

    // Support digipro format: array di dalam data
    let transactionsList = transactions;
    if (!transactionsList && Array.isArray(data)) {
      transactionsList = data;
    }

    if (!Array.isArray(transactionsList) || transactionsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'transactions array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const tx of transactionsList) {
      try {
        // Parse setiap transaction (support digipro format)
        const parsed = parseDigiproCallback(tx);
        const { ref_id } = parsed;
        
        if (!ref_id) {
          errors.push({ ref_id: null, error: 'ref_id is required' });
          continue;
        }

        const transaction = await getTransactionByRefId(ref_id);
        
        if (!transaction) {
          errors.push({ ref_id, error: 'Transaction not found' });
          continue;
        }

        const updateData = {};
        if (parsed.status_code !== undefined) updateData.status_code = parsed.status_code;
        if (parsed.success !== undefined) updateData.success = parsed.success;
        if (parsed.response_data !== undefined) updateData.response_data = parsed.response_data;
        if (parsed.error_message !== undefined) updateData.error_message = parsed.error_message;
        if (parsed.raw_response !== undefined) updateData.raw_response = parsed.raw_response;
        if (parsed.response_time !== undefined) updateData.response_time = parsed.response_time;

        const updateResult = await updateTransactionByRefId(ref_id, updateData);

        if (updateResult.updated) {
          results.push({ ref_id, success: true });
          
          // Update batch stats
          if (transaction.batch_id) {
            try {
              await updateBatchStats(transaction.batch_id);
            } catch (error) {
              console.error('Error updating batch stats:', error);
            }
          }
        } else {
          errors.push({ ref_id, error: 'Update failed' });
        }
      } catch (error) {
        errors.push({ ref_id: tx.ref_id || tx.data?.ref_id || 'unknown', error: error.message });
      }
    }

    res.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get transaction status by ref_id (untuk polling/check status)
 */
export const getTransactionStatus = async (req, res) => {
  try {
    const { ref_id } = req.params;

    if (!ref_id) {
      return res.status(400).json({
        success: false,
        message: 'ref_id is required'
      });
    }

    const transaction = await getTransactionByRefId(ref_id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        ref_id: transaction.ref_id,
        status_code: transaction.status_code,
        success: transaction.success,
        response_data: transaction.response_data,
        error_message: transaction.error_message,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





