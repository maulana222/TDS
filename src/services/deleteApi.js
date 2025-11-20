/**
 * API service untuk delete operations
 */

// Gunakan relative path untuk production, atau environment variable
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3737');

/**
 * Get auth token dari localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Delete all transactions
 */
export async function deleteAllTransactions() {
  try {
    const response = await fetch(`${API_URL}/api/delete/transactions`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transactions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting transactions:', error);
    throw error;
  }
}

/**
 * Delete transactions by date range
 */
export async function deleteTransactionsByDateRange(startDate, endDate) {
  try {
    const response = await fetch(`${API_URL}/api/delete/transactions/date-range`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transactions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting transactions by date:', error);
    throw error;
  }
}

/**
 * Delete single transaction by ID
 */
export async function deleteTransactionById(transactionId) {
  try {
    const response = await fetch(`${API_URL}/api/delete/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transaction');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

