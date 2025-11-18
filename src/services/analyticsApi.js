/**
 * API service untuk analytics operations
 */

import { getSettings } from './settingsService';

function getBackendUrl() {
  const settings = getSettings();
  return settings.backendUrl || import.meta.env.VITE_API_URL || 'http://localhost:3737';
}

const API_URL = getBackendUrl();

/**
 * Get auth token dari localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Get dashboard statistics (all data)
 */
export async function getDashboardStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.days) params.append('days', filters.days);

    const response = await fetch(`${API_URL}/api/analytics/dashboard?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get dashboard stats');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * Get transaction statistics only
 */
export async function getStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await fetch(`${API_URL}/api/analytics/stats?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get stats');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

