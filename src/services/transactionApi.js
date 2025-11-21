/**
 * API service untuk transaction operations (save/get dari database)
 */

import { getSettings } from './settingsService';

// Gunakan environment variable atau subdomain backend
function getBackendUrl() {
  return import.meta.env.VITE_API_URL || 'https://api-tds.pix-ly.app';
}

/**
 * Get auth token dari localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Generate batch ID
 */
export function generateBatchId() {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create transaction batch
 */
export async function createBatch(batchId, totalTransactions, config = null) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        batch_id: batchId,
        total_transactions: totalTransactions,
        config
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
}

/**
 * Update batch status
 */
export async function updateBatch(batchId, updates) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions/batches/${batchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating batch:', error);
    throw error;
  }
}

/**
 * Save single transaction
 */
export async function saveTransaction(transactionData, batchId = null) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        ...transactionData,
        batch_id: batchId
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

/**
 * Save multiple transactions (bulk)
 */
export async function saveTransactions(transactions, batchId = null) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        transactions,
        batch_id: batchId
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
}

/**
 * Get transactions dengan filter
 */
export async function getTransactions(filters = {}, pagination = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.success !== undefined) params.append('success', filters.success);
    if (filters.customer_no) params.append('customer_no', filters.customer_no);
    if (filters.product_code) params.append('product_code', filters.product_code);
    if (filters.ref_id) params.append('ref_id', filters.ref_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    if (pagination.page) params.append('page', pagination.page);
    if (pagination.limit) params.append('limit', pagination.limit);

    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

/**
 * Get transaction statistics
 */
export async function getTransactionStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions/stats?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

/**
 * Get batches
 */
export async function getBatches(limit = 20) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/transactions/batches?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting batches:', error);
    throw error;
  }
}

