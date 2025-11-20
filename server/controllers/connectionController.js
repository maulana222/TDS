import { getUserSettings } from '../models/settingsModel.js';
import CryptoJS from 'crypto-js';

/**
 * Check balance for Digiswitch connection
 */
export const checkBalanceHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user settings
    const settings = await getUserSettings(userId);
    
    if (!settings.digiprosb_username || !settings.digiprosb_api_key) {
      return res.status(400).json({
        success: false,
        message: 'Username dan API Key belum dikonfigurasi'
      });
    }

    // Generate signature: md5(username + apiKey + "depo")
    const signatureString = settings.digiprosb_username + settings.digiprosb_api_key + 'depo';
    const signature = CryptoJS.MD5(signatureString).toString();

    // Request ke API Digiswitch
    const response = await fetch('https://digiprosb.api.digiswitch.id/v1/user/api/cek-saldo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: settings.digiprosb_username,
        sign: signature
      })
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.deposit !== undefined) {
      const balance = parseFloat(data.data.deposit);
      
      res.json({
        success: true,
        data: {
          balance: balance,
          connection: 'digiswitch'
        }
      });
    } else {
      res.status(response.status || 500).json({
        success: false,
        message: data.message || 'Gagal mendapatkan saldo',
        error: data
      });
    }
  } catch (error) {
    console.error('Error checking balance:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengecek saldo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

