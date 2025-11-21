/**
 * Settings service untuk mengelola pengaturan aplikasi
 * Sekarang menggunakan API dari database, bukan localStorage atau .env
 */

import { getSettings as getSettingsFromAPI } from './settingsApi.js';

// Cache untuk settings
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

/**
 * Get settings dari API (dengan cache)
 */
export async function getSettings() {
  try {
    // Check cache
    const now = Date.now();
    if (settingsCache && (now - settingsCacheTime) < CACHE_DURATION) {
      return settingsCache;
    }

    // Get from API
    const apiSettings = await getSettingsFromAPI();
    
    // Convert backend format ke frontend format
    const frontendSettings = {
      defaultDelay: apiSettings.default_delay || 0,
      defaultLimit: apiSettings.default_limit || 50,
      autoRefresh: apiSettings.auto_refresh || false,
      refreshInterval: apiSettings.refresh_interval || 30,
      showNotifications: apiSettings.show_notifications !== undefined ? apiSettings.show_notifications : true,
      exportFormat: apiSettings.export_format || 'excel',
      backendUrl: import.meta.env.VITE_API_URL || 'https://api-tds.pix-ly.app',
      digiprosbUsername: apiSettings.digiprosb_username || '',
      digiprosbApiKey: apiSettings.digiprosb_api_key || '',
      digiprosbEndpoint: apiSettings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
    };

    // Update cache
    settingsCache = frontendSettings;
    settingsCacheTime = now;

    return frontendSettings;
  } catch (error) {
    console.error('Error getting settings from API:', error);
    
    // Return default settings jika API error
    return {
      defaultDelay: 0,
      defaultLimit: 50,
      autoRefresh: false,
      refreshInterval: 30,
      showNotifications: true,
      exportFormat: 'excel',
      backendUrl: import.meta.env.VITE_API_URL || 'https://api-tds.pix-ly.app',
      digiprosbUsername: '',
      digiprosbApiKey: '',
      digiprosbEndpoint: 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
    };
  }
}

/**
 * Clear settings cache
 */
export function clearSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

/**
 * Get specific setting value (async)
 */
export async function getSetting(key, defaultValue = null) {
  const settings = await getSettings();
  return settings[key] !== undefined ? settings[key] : defaultValue;
}


 * Sekarang menggunakan API dari database, bukan localStorage atau .env
 */

import { getSettings as getSettingsFromAPI } from './settingsApi.js';

// Cache untuk settings
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

/**
 * Get settings dari API (dengan cache)
 */
export async function getSettings() {
  try {
    // Check cache
    const now = Date.now();
    if (settingsCache && (now - settingsCacheTime) < CACHE_DURATION) {
      return settingsCache;
    }

    // Get from API
    const apiSettings = await getSettingsFromAPI();
    
    // Convert backend format ke frontend format
    const frontendSettings = {
      defaultDelay: apiSettings.default_delay || 0,
      defaultLimit: apiSettings.default_limit || 50,
      autoRefresh: apiSettings.auto_refresh || false,
      refreshInterval: apiSettings.refresh_interval || 30,
      showNotifications: apiSettings.show_notifications !== undefined ? apiSettings.show_notifications : true,
      exportFormat: apiSettings.export_format || 'excel',
      backendUrl: import.meta.env.VITE_API_URL || 'http://202.155.94.175:3737',
      digiprosbUsername: apiSettings.digiprosb_username || '',
      digiprosbApiKey: apiSettings.digiprosb_api_key || '',
      digiprosbEndpoint: apiSettings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
    };

    // Update cache
    settingsCache = frontendSettings;
    settingsCacheTime = now;

    return frontendSettings;
  } catch (error) {
    console.error('Error getting settings from API:', error);
    
    // Return default settings jika API error
    return {
      defaultDelay: 0,
      defaultLimit: 50,
      autoRefresh: false,
      refreshInterval: 30,
      showNotifications: true,
      exportFormat: 'excel',
      backendUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3737',
      digiprosbUsername: '',
      digiprosbApiKey: '',
      digiprosbEndpoint: 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
    };
  }
}

/**
 * Clear settings cache
 */
export function clearSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

/**
 * Get specific setting value (async)
 */
export async function getSetting(key, defaultValue = null) {
  const settings = await getSettings();
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

