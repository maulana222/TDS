// Gunakan environment variable atau IP VPS
const API_URL = import.meta.env.VITE_API_URL || 'http://202.155.94.175:3737';

/**
 * Get all members/users
 */
export async function getAllMembers() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get members');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get roles');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting roles:', error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateMemberRole(userId, roleId) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roleId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update member role');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteMember(userId) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete member');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}



/**
 * Get all members/users
 */
export async function getAllMembers() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get members');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get roles');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting roles:', error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateMemberRole(userId, roleId) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roleId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update member role');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteMember(userId) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/api/roles/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete member');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
}

