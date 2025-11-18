USE snifer_db;

-- Add status column to transactions table
ALTER TABLE transactions 
ADD COLUMN status VARCHAR(50) DEFAULT NULL COMMENT 'Status transaksi: Pending, Sukses, Gagal, dll' 
AFTER success;

