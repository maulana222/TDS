import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { checkSQLInjection } from '../middleware/security.js';
import { getUserRoleNames } from '../models/roleModel.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input sudah divalidasi oleh middleware, tapi double check untuk safety
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Additional security check - detect SQL injection attempts
    if (checkSQLInjection(username) || checkSQLInjection(password)) {
      console.warn('Potential SQL injection attempt detected:', { username });
      return res.status(400).json({
        success: false,
        message: 'Input tidak valid'
      });
    }

    // Sanitize username (remove whitespace, lowercase)
    const sanitizedUsername = username.trim().toLowerCase();

    // Get user from database menggunakan prepared statement (mencegah SQL injection)
    // Prepared statement dengan parameterized query sudah aman dari SQL injection
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.password, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.username = ?`,
      [sanitizedUsername]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Get user role (from role_id or fallback to getUserRoleNames)
    let userRoles = [];
    if (user.role_name) {
      userRoles = [user.role_name];
    } else {
      userRoles = await getUserRoleNames(user.id);
    }

    // Check if user has role - jika tidak ada role, reject login
    if (!userRoles || userRoles.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda belum memiliki role. Silakan hubungi administrator untuk mendapatkan akses.'
      });
    }

    // Generate JWT token dengan roles
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        roles: userRoles
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    // Get fresh roles from database
    const userRoles = await getUserRoleNames(req.user.id);
    
    // Check if user has role - jika tidak ada role, reject
    if (!userRoles || userRoles.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda belum memiliki role. Silakan hubungi administrator untuk mendapatkan akses.'
      });
    }
    
    // Return user dengan fresh roles
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

