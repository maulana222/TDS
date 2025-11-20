/**
 * API service untuk log operations
 */

const API_URL = 'http://localhost:3737';

/**
 * Get auth token dari localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Get logs dengan filter dan pagination
 */
export async function getLogs(filters = {}, pagination = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.log_type) params.append('log_type', filters.log_type);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.ref_id) params.append('ref_id', filters.ref_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    if (pagination.page) params.append('page', pagination.page);
    if (pagination.limit) params.append('limit', pagination.limit);

    const response = await fetch(`${API_URL}/api/logs?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get logs');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting logs:', error);
    throw error;
  }
}

/**
 * Get log by ID
 */
export async function getLogById(logId) {
  try {
    const response = await fetch(`${API_URL}/api/logs/${logId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get log');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting log:', error);
    throw error;
  }
}

/**
 * Get log statistics
 */
export async function getLogStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await fetch(`${API_URL}/api/logs/stats?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get log stats');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting log stats:', error);
    throw error;
  }
}

/**
 * Save transaction log (untuk logging request/response dari frontend)
 */
export async function saveTransactionLog(logData) {
  try {
    const response = await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(logData)
    });

    if (!response.ok) {
      throw new Error('Failed to save log');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving transaction log:', error);
    // Don't throw, just log - jangan gagalkan transaksi jika log gagal
    return { success: false };
  }
}

/**
 * Delete all logs (user's own logs, or all logs if admin)
 */
export async function deleteAllLogs() {
  try {
    const response = await fetch(`${API_URL}/api/logs`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete logs');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting logs:', error);
    throw error;
  }
}

