/**
 * API service untuk settings operations
 */

const API_URL = 'http://localhost:3737';

/**
 * Get auth token dari localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Get user settings dari API
 */
export async function getSettings() {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get settings');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
}

/**
 * Save user settings ke API
 */
export async function saveSettings(settings) {
  try {
    // Convert frontend format ke backend format
    const backendSettings = {
      default_delay: settings.defaultDelay || 0,
      default_limit: settings.defaultLimit || 50,
      auto_refresh: settings.autoRefresh || false,
      refresh_interval: settings.refreshInterval || 30,
      show_notifications: settings.showNotifications !== undefined ? settings.showNotifications : true,
      export_format: settings.exportFormat || 'excel',
      digiprosb_username: settings.digiprosbUsername || null,
      digiprosb_api_key: settings.digiprosbApiKey || null,
      digiprosb_endpoint: settings.digiprosbEndpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction',
      digiflazz_username: settings.digiflazzUsername || null,
      digiflazz_api_key: settings.digiflazzApiKey || null,
      digiflazz_endpoint: settings.digiflazzEndpoint || 'https://api.digiflazz.com/v1/transaction',
      telegram_bot_token: settings.telegramBotToken || null
    };

    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(backendSettings)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Reset user settings to default
 */
export async function resetSettings() {
  try {
    const response = await fetch(`${API_URL}/api/settings/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reset settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Clear settings cache (helper untuk clear cache di settingsService)
 */
export function clearSettingsCache() {
  // This is just a placeholder, actual cache clearing is in settingsService
  // But we export it here for convenience
}

