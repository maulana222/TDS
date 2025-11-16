import { getAuthToken, getBackendUrl } from './authService';

/**
 * Send message to Telegram
 * @param {string} chatId - Chat ID or username (e.g., "123456789" or "@username")
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} Response from API
 */
export async function sendTelegramMessage(chatId, message) {
  try {
    const API_URL = getBackendUrl();
    const response = await fetch(`${API_URL}/api/telegram/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        chat_id: chatId,
        message: message
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengirim pesan');
    }

    return data;
  } catch (error) {
    console.error('Error sending telegram message:', error);
    throw error;
  }
}

/**
 * Send bulk messages to multiple Telegram targets
 * @param {Array<string>} targets - Array of chat IDs or usernames
 * @param {string} message - Message text to send
 * @param {Function} onProgress - Callback untuk update progress
 * @param {number} delay - Delay antar pesan dalam milidetik
 * @returns {Promise<Object>} Results dengan success/failed count
 */
export async function sendBulkTelegramMessages(targets, message, onProgress, delay = 1000) {
  const results = {
    total: targets.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    
    try {
      const result = await sendTelegramMessage(target, message);
      results.success++;
      results.details.push({
        target,
        success: true,
        message: 'Pesan berhasil dikirim'
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        target,
        success: false,
        error: error.message
      });
    }

    // Update progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: targets.length,
        success: results.success,
        failed: results.failed
      });
    }

    // Delay antar pesan (kecuali untuk pesan terakhir)
    if (i < targets.length - 1 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

