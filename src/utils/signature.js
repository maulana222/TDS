import CryptoJS from 'crypto-js';

/**
 * Generate MD5 signature untuk API request
 * @param {string} username - Username API
 * @param {string} apiKey - API Key
 * @param {string} refId - Reference ID
 * @returns {string} MD5 hash signature
 */
export function generateSignature(username, apiKey, refId) {
  const string = username + apiKey + refId;
  return CryptoJS.MD5(string).toString();
}

