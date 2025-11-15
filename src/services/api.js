/**
 * API client untuk melakukan request transaksi
 */

import { getSettings } from './settingsService';
import { saveTransactionLog } from './logApi.js';

// Get settings untuk API configuration (async)
async function getApiConfig() {
  const settings = await getSettings();
  return {
    endpoint: settings.digiprosbEndpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction',
    username: settings.digiprosbUsername || '',
    apiKey: settings.digiprosbApiKey || ''
  };
}

/**
 * Lakukan request transaksi ke API
 * @param {Object} params - Parameter transaksi
 * @param {string} params.productCode - Kode produk
 * @param {string} params.customerNo - Nomor customer
 * @param {string} params.refId - Reference ID
 * @param {string} params.signature - MD5 signature
 * @returns {Promise<Object>} Response dari API
 */
export async function doTransaction({ productCode, customerNo, refId, signature }) {
  const apiConfig = await getApiConfig();
  
  const payload = {
    username: apiConfig.username,
    code: productCode,
    customer_no: customerNo,
    ref_id: refId,
    sign: signature
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const startTime = Date.now();
  
  try {
    // Gunakan proxy di development, atau langsung API di production
    const apiUrl = import.meta.env.DEV 
      ? `/api/v1/user/api/transaction` 
      : apiConfig.endpoint;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    
    let responseData = null;
    try {
      responseData = JSON.parse(responseBody);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseBody}`);
    }

    // Save log untuk transaction request (outgoing)
    try {
      await saveTransactionLog({
        ref_id: refId,
        log_type: 'transaction_request',
        direction: 'outgoing',
        method: 'POST',
        endpoint: apiUrl,
        request_body: payload,
        response_body: responseData,
        status_code: response.status,
        execution_time: responseTime
      });
    } catch (logError) {
      console.error('Error saving transaction request log:', logError);
      // Don't fail the transaction if log save fails
    }
    
    return {
      success: response.status === 200,
      status: response.status,
      responseTime,
      data: responseData.data || responseData,
      rawResponse: responseBody,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

