import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { checkSQLInjection } from '../middleware/security.js';

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
      'SELECT id, username, password FROM users WHERE username = ?',
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
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
        username: user.username
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
    // If middleware passes, token is valid
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

