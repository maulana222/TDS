import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getRolesHandler,
  getRoleByIdHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
  getUserRolesHandler,
  assignRoleHandler,
  removeRoleHandler,
  getAllUsersWithRolesHandler,
  updateUserRoleHandler,
  deleteUserHandler
} from '../controllers/roleController.js';

const router = express.Router();

// Semua route memerlukan authentication
router.use(authenticateToken);

// Get all roles (admin only)
router.get('/', requireRole('admin'), getRolesHandler);

// Get role by ID (admin only)
router.get('/:id', requireRole('admin'), getRoleByIdHandler);

// Create role (admin only)
router.post('/', requireRole('admin'), createRoleHandler);

// Update role (admin only)
router.put('/:id', requireRole('admin'), updateRoleHandler);

// Delete role (admin only)
router.delete('/:id', requireRole('admin'), deleteRoleHandler);

// Get user roles
router.get('/user/:userId', getUserRolesHandler);

// Assign role to user (admin only)
router.post('/user/:userId/assign', requireRole('admin'), assignRoleHandler);

// Remove role from user (admin only)
router.delete('/user/:userId/role/:roleId', requireRole('admin'), removeRoleHandler);

// Get all users with roles (admin only)
router.get('/users/all', requireRole('admin'), getAllUsersWithRolesHandler);

// Update user role (admin only)
router.put('/users/:userId/role', requireRole('admin'), updateUserRoleHandler);

// Delete user (admin only)
router.delete('/users/:userId', requireRole('admin'), deleteUserHandler);

export default router;

