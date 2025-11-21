USE tds_db;

-- Add updated_at column to transactions table
ALTER TABLE transactions 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER created_at;


