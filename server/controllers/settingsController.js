import { getUserSettings, saveUserSettings, resetUserSettings } from '../models/settingsModel.js';

/**
 * Get user settings
 */
export const getSettingsHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    const settings = await getUserSettings(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Save user settings
 */
export const saveSettingsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Validasi required fields untuk Digiprosb (jika diisi)
    if (settings.digiprosb_username || settings.digiprosb_api_key || settings.digiprosb_endpoint) {
      if (!settings.digiprosb_username || !settings.digiprosb_api_key || !settings.digiprosb_endpoint) {
        return res.status(400).json({
          success: false,
          message: 'Jika mengisi Digiprosb, Username, API Key, dan API Endpoint harus diisi semua'
        });
      }
      // Validasi URL endpoint Digiprosb
      try {
        new URL(settings.digiprosb_endpoint);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Digiprosb API Endpoint harus berupa URL yang valid'
        });
      }
    }

    // Validasi required fields untuk Digiflazz (jika diisi)
    if (settings.digiflazz_username || settings.digiflazz_api_key || settings.digiflazz_endpoint) {
      if (!settings.digiflazz_username || !settings.digiflazz_api_key || !settings.digiflazz_endpoint) {
        return res.status(400).json({
          success: false,
          message: 'Jika mengisi Digiflazz, Username, API Key, dan API Endpoint harus diisi semua'
        });
      }
      // Validasi URL endpoint Digiflazz
      try {
        new URL(settings.digiflazz_endpoint);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Digiflazz API Endpoint harus berupa URL yang valid'
        });
      }
    }

    await saveUserSettings(userId, settings);

    res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset user settings to default
 */
export const resetSettingsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    await resetUserSettings(userId);

    res.json({
      success: true,
      message: 'Settings reset to default'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

