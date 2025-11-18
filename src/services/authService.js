const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3737';

/**
 * Get backend URL
 * @returns {string}
 */
export function getBackendUrl() {
  return API_URL;
}

/**
 * Login user
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login gagal');
    }

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  // Clear all welcome messages from session storage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('welcome_')) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Get current user from localStorage
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Get auth token from localStorage
 * @returns {string|null}
 */
export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

// Cache untuk token verification dengan expiry time
let tokenVerificationCache = {
  timestamp: null,
  result: null,
  expiryTime: 60 * 1000 // 60 detik cache (diperpanjang untuk mengurangi request)
};

/**
 * Verify token with server (dengan caching untuk menghindari rate limit)
 * @param {boolean} forceRefresh - Force refresh tanpa menggunakan cache
 * @returns {Promise<Object>}
 */
export async function verifyToken(forceRefresh = false) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No token found');
    }

    // Check cache jika tidak force refresh
    if (!forceRefresh && tokenVerificationCache.result && tokenVerificationCache.timestamp) {
      const now = Date.now();
      const cacheAge = now - tokenVerificationCache.timestamp;
      
      // Jika cache masih valid (kurang dari expiry time), return cached result
      if (cacheAge < tokenVerificationCache.expiryTime) {
        return tokenVerificationCache.result;
      }
    }

    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Jika rate limit error, jangan langsung logout, gunakan cache jika ada
      if (response.status === 429 || (data.message && data.message.includes('Terlalu banyak'))) {
        // Check cache sebelum clear
        const cachedResult = tokenVerificationCache.result;
        const cachedTimestamp = tokenVerificationCache.timestamp;
        
        if (cachedResult && cachedTimestamp) {
          const now = Date.now();
          const cacheAge = now - cachedTimestamp;
          if (cacheAge < tokenVerificationCache.expiryTime) {
            console.warn('Rate limit hit, using cached token verification');
            return cachedResult;
          }
        }
      }
      
      // Clear cache jika verification gagal (bukan rate limit atau cache tidak valid)
      tokenVerificationCache = {
        timestamp: null,
        result: null,
        expiryTime: 60 * 1000
      };
      
      throw new Error(data.message || 'Token verification failed');
    }

    // Update user in localStorage with fresh roles
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    // Update cache dengan hasil yang valid
    tokenVerificationCache = {
      timestamp: Date.now(),
      result: data,
      expiryTime: 60 * 1000 // 60 detik (diperpanjang untuk mengurangi request)
    };

    return data;
  } catch (error) {
    // If verification fails, clear local storage
    logout();
    throw error;
  }
}

/**
 * Get user roles from current user
 * @returns {Array<string>}
 */
export function getUserRoles() {
  const user = getCurrentUser();
  return user?.roles || [];
}

/**
 * Check if user has specific role
 * @param {string|Array<string>} role - Role atau array of roles
 * @returns {boolean}
 */
export function hasRole(role) {
  const userRoles = getUserRoles();
  
  // Admin selalu memiliki akses penuh
  if (userRoles.includes('admin')) {
    return true;
  }
  
  const rolesArray = Array.isArray(role) ? role : [role];
  return rolesArray.some(r => userRoles.includes(r));
}

/**
 * Check if user has all specified roles
 * @param {Array<string>} roles - Array of roles
 * @returns {boolean}
 */
export function hasAllRoles(roles) {
  const userRoles = getUserRoles();
  
  // Admin selalu memiliki akses penuh
  if (userRoles.includes('admin')) {
    return true;
  }
  
  return roles.every(r => userRoles.includes(r));
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole('admin');
}

