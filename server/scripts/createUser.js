import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script untuk membuat user baru dengan role
 * Usage: node server/scripts/createUser.js <username> <password> [role]
 * Role: admin atau member (default: member)
 */

const createUser = async (username, password, roleName = 'member') => {
  try {
    if (!username || !password) {
      console.error('❌ Usage: node server/scripts/createUser.js <username> <password> [role]');
      console.error('   Role: admin atau member (default: member)');
      process.exit(1);
    }

    // Validate role
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(roleName)) {
      console.error(`❌ Role tidak valid. Gunakan: ${validRoles.join(' atau ')}`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username.toLowerCase(), hashedPassword]
    );

    const userId = result.insertId;
    console.log(`✅ User "${username}" berhasil dibuat dengan ID: ${userId}`);

    // Get role ID
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      [roleName]
    );

    if (roles.length === 0) {
      console.error(`❌ Role "${roleName}" tidak ditemukan. Pastikan migration sudah dijalankan.`);
      process.exit(1);
    }

    const roleId = roles[0].id;

    // Assign role to user (update role_id in users table)
    try {
      await pool.execute(
        'UPDATE users SET role_id = ? WHERE id = ?',
        [roleId, userId]
      );
      console.log(`✅ Role "${roleName}" berhasil ditambahkan ke user "${username}"`);
      
      // Also insert to user_roles for backward compatibility
      try {
        await pool.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id',
          [userId, roleId]
        );
      } catch (roleError) {
        // Ignore if already exists
      }
    } catch (roleError) {
      console.error('❌ Error assigning role:', roleError.message);
      throw roleError;
    }

    console.log(`\n✅ User "${username}" berhasil dibuat dengan role "${roleName}"`);
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error(`❌ Username "${username}" sudah ada`);
    } else {
      console.error('❌ Error:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
};

const [,, username, password, role] = process.argv;
createUser(username, password, role);

