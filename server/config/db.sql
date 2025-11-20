-- Create database
CREATE DATABASE tds_db;
USE tds_db;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
-- Password hash untuk 'admin123' dengan bcrypt
INSERT INTO users (username, password) 
VALUES ('admin', '$2b$10$rQZ8vK5J5J5J5J5J5J5J5uJ5J5J5J5J5J5J5J5J5J5J5J5J5J5J5J5J5')
ON DUPLICATE KEY UPDATE username=username;

-- Note: Default password adalah 'admin123'
-- Untuk generate password hash baru, gunakan bcrypt dengan salt rounds 10

-- Create transactions table
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_no VARCHAR(50) NOT NULL COMMENT 'Original customer number dari Excel',
  customer_no_used VARCHAR(50) NOT NULL COMMENT 'Customer number yang digunakan untuk request (normalized)',
  product_code VARCHAR(50) NOT NULL,
  ref_id VARCHAR(100) NOT NULL,
  signature VARCHAR(255) NOT NULL,
  status_code INT DEFAULT NULL COMMENT 'HTTP status code dari response',
  success BOOLEAN DEFAULT FALSE COMMENT 'Apakah transaksi berhasil',
  response_time INT DEFAULT NULL COMMENT 'Response time dalam milliseconds',
  response_data JSON DEFAULT NULL COMMENT 'Data response dari API',
  error_message TEXT DEFAULT NULL COMMENT 'Error message jika gagal',
  raw_response TEXT DEFAULT NULL COMMENT 'Raw response dari API',
  row_number INT DEFAULT NULL COMMENT 'Nomor baris dari Excel',
  batch_id VARCHAR(100) DEFAULT NULL COMMENT 'ID untuk grouping transaksi dalam satu batch',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_customer_no (customer_no),
  INDEX idx_product_code (product_code),
  INDEX idx_ref_id (ref_id),
  INDEX idx_batch_id (batch_id),
  INDEX idx_created_at (created_at),
  INDEX idx_success (success),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create transaction_batches table untuk tracking batch processing
CREATE TABLE transaction_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  batch_id VARCHAR(100) UNIQUE NOT NULL,
  total_transactions INT NOT NULL,
  successful_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  config JSON DEFAULT NULL COMMENT 'Konfigurasi batch (delay, dll)',
  status ENUM('processing', 'completed', 'cancelled', 'paused') DEFAULT 'processing',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_batch_id (batch_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user_settings table untuk menyimpan settings per user
CREATE TABLE user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  default_delay DECIMAL(10, 2) DEFAULT 0 COMMENT 'Default delay antar request dalam detik',
  default_limit INT DEFAULT 50 COMMENT 'Default limit pagination',
  auto_refresh BOOLEAN DEFAULT FALSE COMMENT 'Aktifkan auto refresh',
  refresh_interval INT DEFAULT 30 COMMENT 'Interval refresh dalam detik',
  show_notifications BOOLEAN DEFAULT TRUE COMMENT 'Tampilkan notifikasi',
  export_format ENUM('excel', 'csv', 'json') DEFAULT 'excel' COMMENT 'Format export default',
  digiprosb_username VARCHAR(255) DEFAULT NULL COMMENT 'Username untuk Digiprosb API',
  digiprosb_api_key VARCHAR(255) DEFAULT NULL COMMENT 'API Key untuk Digiprosb API',
  digiprosb_endpoint VARCHAR(500) DEFAULT 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction' COMMENT 'Endpoint Digiprosb API',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create transaction_logs table untuk menyimpan log callback dan transaksi
CREATE TABLE transaction_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  transaction_id INT DEFAULT NULL COMMENT 'ID dari tabel transactions jika terkait dengan transaksi',
  ref_id VARCHAR(100) DEFAULT NULL COMMENT 'Reference ID transaksi',
  log_type ENUM('callback_in', 'callback_out', 'transaction_request', 'transaction_response', 'error') NOT NULL COMMENT 'Jenis log',
  direction ENUM('incoming', 'outgoing') NOT NULL COMMENT 'Arah log (masuk/keluar)',
  method VARCHAR(10) DEFAULT NULL COMMENT 'HTTP method (GET, POST, dll)',
  endpoint VARCHAR(500) DEFAULT NULL COMMENT 'Endpoint yang diakses',
  request_body JSON DEFAULT NULL COMMENT 'Request body (untuk outgoing)',
  response_body JSON DEFAULT NULL COMMENT 'Response body (untuk incoming)',
  request_headers JSON DEFAULT NULL COMMENT 'Request headers',
  response_headers JSON DEFAULT NULL COMMENT 'Response headers',
  status_code INT DEFAULT NULL COMMENT 'HTTP status code',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP address',
  user_agent TEXT DEFAULT NULL COMMENT 'User agent',
  error_message TEXT DEFAULT NULL COMMENT 'Error message jika ada',
  execution_time INT DEFAULT NULL COMMENT 'Waktu eksekusi dalam milliseconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_ref_id (ref_id),
  INDEX idx_log_type (log_type),
  INDEX idx_direction (direction),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

