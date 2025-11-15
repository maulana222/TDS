import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script untuk membuat user baru
 * Usage: node server/scripts/createUser.js <username> <password>
 */

const createUser = async (username, password) => {
  try {
    if (!username || !password) {
      console.error('❌ Usage: node server/scripts/createUser.js <username> <password>');
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    console.log(`✅ User "${username}" berhasil dibuat dengan ID: ${result.insertId}`);
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error(`❌ Username "${username}" sudah ada`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
};

const [,, username, password] = process.argv;
createUser(username, password);

