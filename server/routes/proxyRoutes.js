import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getUserSettings } from '../models/settingsModel.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Proxy endpoint untuk request ke Digiprosb API
 * Mengatasi CORS issue dengan melakukan request dari backend
 */
router.post('/transaction', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user settings untuk mendapatkan endpoint dan credentials
    const settings = await getUserSettings(userId);
    
    if (!settings.digiprosb_username || !settings.digiprosb_api_key) {
      return res.status(400).json({
        success: false,
        message: 'Username dan API Key belum dikonfigurasi'
      });
    }

    const endpoint = settings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction';
    
    // Forward request ke Digiprosb API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const responseBody = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseBody);
    } catch (e) {
      responseData = { error: 'Invalid JSON response', raw: responseBody };
    }

    // Forward response dari Digiprosb API
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Error in proxy transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding request to Digiprosb API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

