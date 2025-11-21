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
    // Selalu gunakan proxy melalui backend untuk menghindari CORS issue
    // Proxy endpoint: /api/proxy/transaction
    const apiUrl = '/api/proxy/transaction';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      credentials: 'include' // Include cookies untuk authentication
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
    
    // Extract response data
    const data = responseData.data || responseData;
    
    // Determine success based on status and rc
    // If status = "Pending" or rc = "03", transaction is pending (not successful yet)
    const isPending = data.status === 'Pending' || data.status === 'pending' || data.rc === '03';
    const isSuccess = response.status === 200 && !isPending && (data.status === 'Sukses' || data.status === 'Sukses' || data.rc === '00');
    
    return {
      success: isSuccess,
      status: data.status || response.status,
      statusCode: response.status,
      responseTime,
      data: data,
      rawResponse: responseBody,
      timestamp: new Date().toISOString(),
      isPending: isPending
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

