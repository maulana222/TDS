/**
 * File-based storage utilities untuk menyimpan history dan logs
 * Menggunakan localStorage sebagai fallback untuk web app
 */

const STORAGE_KEY = 'snifer_transactions';
const HISTORY_PREFIX = 'snifer_history_';

/**
 * Simpan transaction history
 * @param {Object} transactionData - Data transaksi yang akan disimpan
 */
export async function saveTransactionHistory(transactionData) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `transaction-${timestamp}.json`;
    const key = `${HISTORY_PREFIX}${filename}`;
    
    // Simpan ke localStorage
    const historyEntry = {
      filename,
      timestamp: new Date().toISOString(),
      data: transactionData
    };
    
    localStorage.setItem(key, JSON.stringify(historyEntry));
    
    // Update list history
    const historyList = getHistoryList();
    if (!historyList.includes(filename)) {
      historyList.push(filename);
      localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(historyList));
    }
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error saving history:', error);
    throw error;
  }
}

/**
 * Load transaction history dari storage
 * @param {string} filename - Nama file history
 */
export async function loadTransactionHistory(filename) {
  try {
    const key = `${HISTORY_PREFIX}${filename}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      throw new Error(`History ${filename} tidak ditemukan`);
    }
    
    const historyEntry = JSON.parse(stored);
    
    // Debug: Log structure
    console.log('History entry structure:', {
      hasData: !!historyEntry.data,
      dataKeys: historyEntry.data ? Object.keys(historyEntry.data) : [],
      filename: historyEntry.filename,
      timestamp: historyEntry.timestamp
    });
    
    // Validasi structure
    if (!historyEntry.data) {
      throw new Error('Data history tidak valid: tidak ada field data');
    }
    
    // Pastikan results ada
    if (!historyEntry.data.results) {
      console.warn('History data tidak memiliki results, menambahkan empty array');
      historyEntry.data.results = [];
    }
    
    // Pastikan results adalah array
    if (!Array.isArray(historyEntry.data.results)) {
      console.warn('History results bukan array, mengkonversi ke array');
      historyEntry.data.results = [];
    }
    
    return historyEntry.data;
  } catch (error) {
    console.error('Error loading history:', error);
    throw error;
  }
}

/**
 * Get list semua history files
 */
export async function listHistoryFiles() {
  try {
    return getHistoryList();
  } catch (error) {
    console.error('Error listing history:', error);
    return [];
  }
}

/**
 * Helper untuk get history list dari localStorage
 */
function getHistoryList() {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_list`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Delete single history file
 * @param {string} filename - Nama file history yang akan dihapus
 */
export async function deleteHistoryFile(filename) {
  try {
    const key = `${HISTORY_PREFIX}${filename}`;
    localStorage.removeItem(key);
    
    // Update list history
    const historyList = getHistoryList();
    const updatedList = historyList.filter(f => f !== filename);
    localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(updatedList));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting history file:', error);
    throw error;
  }
}

/**
 * Clear semua history
 */
export function clearAllHistory() {
  try {
    const historyList = getHistoryList();
    historyList.forEach(filename => {
      localStorage.removeItem(`${HISTORY_PREFIX}${filename}`);
    });
    localStorage.removeItem(`${STORAGE_KEY}_list`);
    return { success: true };
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}

