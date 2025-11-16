import https from 'https';
import { getUserSettings } from '../models/settingsModel.js';

/**
 * Send message to Telegram using Bot API
 */
export const sendTelegramMessage = async (req, res) => {
  try {
    const { chat_id, message } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!chat_id) {
      return res.status(400).json({
        success: false,
        message: 'chat_id is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    // Get Telegram Bot Token from settings
    const settings = await getUserSettings(userId);
    const botToken = settings?.telegram_bot_token;

    if (!botToken) {
      return res.status(400).json({
        success: false,
        message: 'Telegram Bot Token belum dikonfigurasi. Silakan set di Settings.'
      });
    }

    // Telegram Bot API endpoint
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Prepare request data
    const requestData = JSON.stringify({
      chat_id: chat_id,
      text: message,
      parse_mode: 'HTML' // Support HTML formatting
    });

    // Make request to Telegram API
    const telegramResponse = await new Promise((resolve, reject) => {
      const url = new URL(telegramApiUrl);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              body: parsed
            });
          } catch (error) {
            reject(new Error(`Failed to parse Telegram response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestData);
      req.end();
    });

    // Check Telegram API response
    if (telegramResponse.statusCode === 200 && telegramResponse.body.ok) {
      return res.json({
        success: true,
        message: 'Pesan berhasil dikirim',
        data: {
          message_id: telegramResponse.body.result.message_id,
          chat_id: telegramResponse.body.result.chat.id,
          date: telegramResponse.body.result.date
        }
      });
    } else {
      const errorDescription = telegramResponse.body.description || 'Unknown error';
      return res.status(400).json({
        success: false,
        message: `Gagal mengirim pesan: ${errorDescription}`,
        error: telegramResponse.body
      });
    }
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

