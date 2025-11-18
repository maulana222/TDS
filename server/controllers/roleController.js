import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getUserRoles,
  getUserRoleNames,
  assignRoleToUser,
  removeRoleFromUser,
  userHasRole,
  getAllUsersWithRoles,
  updateUserRole,
  deleteUser
} from '../models/roleModel.js';

/**
 * Get all roles
 */
export const getRolesHandler = async (req, res) => {
  try {
    const roles = await getAllRoles();
    
    // Parse JSON permissions
    const rolesWithParsedPermissions = roles.map(role => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));
    
    res.json({
      success: true,
      data: rolesWithParsedPermissions
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data roles'
    });
  }
};

/**
 * Get role by ID
 */
export const getRoleByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getRoleById(parseInt(id));
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan'
      });
    }
    
    role.permissions = role.permissions ? JSON.parse(role.permissions) : [];
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data role'
    });
  }
};

/**
 * Create new role
 */
export const createRoleHandler = async (req, res) => {
  try {
    const { name, display_name, description, permissions } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'Name dan display_name harus diisi'
      });
    }
    
    // Check if role name already exists
    const existingRole = await getRoleByName(name);
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role dengan nama tersebut sudah ada'
      });
    }
    
    const roleId = await createRole({
      name,
      display_name,
      description,
      permissions: permissions || []
    });
    
    res.status(201).json({
      success: true,
      message: 'Role berhasil dibuat',
      data: { id: roleId }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat role'
    });
  }
};

/**
 * Update role
 */
export const updateRoleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, permissions } = req.body;
    
    const role = await getRoleById(parseInt(id));
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan'
      });
    }
    
    const affectedRows = await updateRole(parseInt(id), {
      display_name,
      description,
      permissions
    });
    
    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada perubahan data'
      });
    }
    
    res.json({
      success: true,
      message: 'Role berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate role'
    });
  }
};

/**
 * Delete role
 */
export const deleteRoleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await getRoleById(parseInt(id));
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan'
      });
    }
    
    // Prevent deleting default roles
    if (['admin', 'member'].includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus role default'
      });
    }
    
    const affectedRows = await deleteRole(parseInt(id));
    
    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus role'
      });
    }
    
    res.json({
      success: true,
      message: 'Role berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus role'
    });
  }
};

/**
 * Get user roles
 */
export const getUserRolesHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const roles = await getUserRoles(parseInt(userId));
    
    const rolesWithParsedPermissions = roles.map(role => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));
    
    res.json({
      success: true,
      data: rolesWithParsedPermissions
    });
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data roles user'
    });
  }
};

/**
 * Assign role to user
 */
export const assignRoleHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const assignedBy = req.user.id;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'roleId harus diisi'
      });
    }
    
    await assignRoleToUser(parseInt(userId), parseInt(roleId), assignedBy);
    
    res.json({
      success: true,
      message: 'Role berhasil ditambahkan ke user'
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan role ke user'
    });
  }
};

/**
 * Remove role from user
 */
export const removeRoleHandler = async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    const affectedRows = await removeRoleFromUser(parseInt(userId), parseInt(roleId));
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan pada user'
      });
    }
    
    res.json({
      success: true,
      message: 'Role berhasil dihapus dari user'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus role dari user'
    });
  }
};

/**
 * Get all users with roles
 */
export const getAllUsersWithRolesHandler = async (req, res) => {
  try {
    const users = await getAllUsersWithRoles();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users with roles:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data users'
    });
  }
};

/**
 * Update user role
 */
export const updateUserRoleHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'roleId harus diisi'
      });
    }
    
    // Prevent updating own role (optional security measure)
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mengubah role sendiri'
      });
    }
    
    const affectedRows = await updateUserRole(parseInt(userId), parseInt(roleId));
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Role user berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate role user'
    });
  }
};

/**
 * Delete user
 */
export const deleteUserHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent deleting own account
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus akun sendiri'
      });
    }
    
    const affectedRows = await deleteUser(parseInt(userId));
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus user'
    });
  }
};

