import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool dengan security settings
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tds_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Security settings
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Timeout settings
  connectTimeout: 10000,
  // Multiple statements disabled untuk mencegah SQL injection
  multipleStatements: false
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

export default pool;

