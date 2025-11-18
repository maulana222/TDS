import pool from '../config/database.js';

/**
 * Get all roles
 */
export const getAllRoles = async () => {
  const [rows] = await pool.execute(
    `SELECT id, name, display_name, description, permissions, created_at, updated_at
     FROM roles
     ORDER BY name ASC`
  );
  return rows;
};

/**
 * Get role by ID
 */
export const getRoleById = async (roleId) => {
  const [rows] = await pool.execute(
    `SELECT id, name, display_name, description, permissions, created_at, updated_at
     FROM roles
     WHERE id = ?`,
    [roleId]
  );
  return rows[0] || null;
};

/**
 * Get role by name
 */
export const getRoleByName = async (roleName) => {
  const [rows] = await pool.execute(
    `SELECT id, name, display_name, description, permissions, created_at, updated_at
     FROM roles
     WHERE name = ?`,
    [roleName]
  );
  return rows[0] || null;
};

/**
 * Create new role
 */
export const createRole = async (roleData) => {
  const { name, display_name, description, permissions } = roleData;
  
  const [result] = await pool.execute(
    `INSERT INTO roles (name, display_name, description, permissions)
     VALUES (?, ?, ?, ?)`,
    [
      name,
      display_name,
      description || null,
      permissions ? JSON.stringify(permissions) : null
    ]
  );
  
  return result.insertId;
};

/**
 * Update role
 */
export const updateRole = async (roleId, roleData) => {
  const { display_name, description, permissions } = roleData;
  
  const updates = [];
  const values = [];
  
  if (display_name !== undefined) {
    updates.push('display_name = ?');
    values.push(display_name);
  }
  
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  
  if (permissions !== undefined) {
    updates.push('permissions = ?');
    values.push(permissions ? JSON.stringify(permissions) : null);
  }
  
  if (updates.length === 0) {
    return 0;
  }
  
  values.push(roleId);
  
  const [result] = await pool.execute(
    `UPDATE roles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  
  return result.affectedRows;
};

/**
 * Delete role
 */
export const deleteRole = async (roleId) => {
  const [result] = await pool.execute(
    'DELETE FROM roles WHERE id = ?',
    [roleId]
  );
  return result.affectedRows;
};

/**
 * Get user roles
 */
export const getUserRoles = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.name, r.display_name, r.description, r.permissions, ur.assigned_at
     FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?
     ORDER BY r.name ASC`,
    [userId]
  );
  return rows;
};

/**
 * Get user role names (array of role names)
 * Priority: Check role_id in users table first, then user_roles table
 */
export const getUserRoleNames = async (userId) => {
  // First, check if user has role_id directly in users table
  const [userRows] = await pool.execute(
    'SELECT role_id FROM users WHERE id = ?',
    [userId]
  );
  
  if (userRows.length > 0 && userRows[0].role_id) {
    // Get role name from role_id
    const [roleRows] = await pool.execute(
      'SELECT name FROM roles WHERE id = ?',
      [userRows[0].role_id]
    );
    
    if (roleRows.length > 0) {
      return [roleRows[0].name];
    }
  }
  
  // Fallback to user_roles table (for backward compatibility)
  const roles = await getUserRoles(userId);
  return roles.map(role => role.name);
};

/**
 * Assign role to user
 * Update role_id in users table (primary method)
 */
export const assignRoleToUser = async (userId, roleId, assignedBy = null) => {
  try {
    // Update role_id in users table (primary method)
    const [result] = await pool.execute(
      'UPDATE users SET role_id = ? WHERE id = ?',
      [roleId, userId]
    );
    
    // Also update user_roles table for backward compatibility
    try {
      await pool.execute(
        `INSERT INTO user_roles (user_id, role_id, assigned_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP`,
        [userId, roleId, assignedBy]
      );
    } catch (error) {
      // Ignore errors in user_roles (backward compatibility only)
    }
    
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove role from user
 */
export const removeRoleFromUser = async (userId, roleId) => {
  const [result] = await pool.execute(
    'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );
  return result.affectedRows;
};

/**
 * Check if user has role
 */
export const userHasRole = async (userId, roleName) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.name = ?`,
    [userId, roleName]
  );
  return rows[0].count > 0;
};

/**
 * Get all users with their roles
 */
export const getAllUsersWithRoles = async () => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.role_id, u.created_at,
            r.name as role_name,
            r.display_name as role_display_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     ORDER BY u.username ASC`
  );
  
  // Transform to match expected format
  return rows.map(user => ({
    id: user.id,
    username: user.username,
    created_at: user.created_at,
    role_id: user.role_id,
    role_name: user.role_name || null,
    role_display_name: user.role_display_name || null,
    // Keep arrays for backward compatibility
    roles: user.role_name ? [user.role_name] : [],
    role_display_names: user.role_display_name ? [user.role_display_name] : []
  }));
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, roleId) => {
  const [result] = await pool.execute(
    'UPDATE users SET role_id = ? WHERE id = ?',
    [roleId, userId]
  );
  
  // Also update user_roles for backward compatibility
  if (roleId) {
    await pool.execute(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE role_id = ?`,
      [userId, roleId, roleId]
    );
  }
  
  return result.affectedRows;
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ?',
    [userId]
  );
  return result.affectedRows;
};

