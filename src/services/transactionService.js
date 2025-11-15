import { generateSignature } from '../utils/signature.js';
import { generateRefId } from '../utils/refId.js';
import { normalizeCustomerNumber } from '../utils/customerNumber.js';
import { doTransaction } from './api.js';
import { getSettings } from './settingsService.js';

/**
 * Process single transaction
 * @param {Object} transaction - Transaction data
 * @param {string} transaction.customer_no - Customer number (original)
 * @param {string} transaction.customer_no_normalized - Customer number (normalized untuk request)
 * @param {string} transaction.product_code - Product code
 * @param {number} index - Index transaksi (untuk logging)
 * @param {number} total - Total transaksi
 * @returns {Promise<Object>} Transaction result
 */
export async function processTransaction(transaction, index, total) {
  const { customer_no, customer_no_normalized, product_code } = transaction;
  
  // Gunakan normalized untuk request, fallback ke normalize jika tidak ada
  const customerNoForRequest = customer_no_normalized || normalizeCustomerNumber(customer_no);
  
  const refId = generateRefId();
  const settings = await getSettings();
  const username = settings.digiprosbUsername || '';
  const apiKey = settings.digiprosbApiKey || '';
  
  if (!username || !apiKey) {
    throw new Error('Username dan API Key harus diisi di Settings');
  }
  
  const signature = generateSignature(username, apiKey, refId);
  
  const result = await doTransaction({
    productCode: product_code,
    customerNo: customerNoForRequest, // Gunakan normalized untuk request
    refId,
    signature
  });
  
  return {
    ...result,
    index: index + 1,
    total,
    customer_no, // Original untuk display
    customer_no_used: customerNoForRequest, // Yang digunakan untuk request
    product_code,
    ref_id: refId,
    row_number: transaction.row_number
  };
}

/**
 * Process multiple transactions dengan callback untuk progress dan support cancel
 * @param {Array} transactions - Array of transaction data
 * @param {Function} onProgress - Callback untuk update progress
 * @param {number} delay - Delay antar request dalam milidetik (ms)
 * @param {Object} cancelToken - Object dengan property cancelled untuk cancel processing
 * @returns {Promise<Array>} Array of transaction results
 */
export async function processTransactions(transactions, onProgress, delay = 0, cancelToken = { cancelled: false }) {
  const results = [];
  const total = transactions.length;
  
  for (let i = 0; i < transactions.length; i++) {
    // Check jika di-cancel
    if (cancelToken.cancelled) {
      break;
    }

    const transaction = transactions[i];
    
    try {
      const result = await processTransaction(transaction, i, total);
      results.push(result);
      
      // Callback progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          result,
          progress: ((i + 1) / total) * 100,
          cancelled: cancelToken.cancelled
        });
      }
      
      // Delay jika diperlukan (dan tidak di-cancel)
      if (delay > 0 && i < transactions.length - 1 && !cancelToken.cancelled) {
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, delay);
          // Check cancel setiap 100ms selama delay
          const checkCancel = setInterval(() => {
            if (cancelToken.cancelled) {
              clearTimeout(timeout);
              clearInterval(checkCancel);
              resolve();
            }
          }, 100);
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        customer_no: transaction.customer_no,
        product_code: transaction.product_code,
        row_number: transaction.row_number,
        index: i + 1,
        total,
        timestamp: new Date().toISOString()
      };
      
      results.push(errorResult);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          result: errorResult,
          progress: ((i + 1) / total) * 100,
          cancelled: cancelToken.cancelled
        });
      }
    }
  }
  
  return results;
}

