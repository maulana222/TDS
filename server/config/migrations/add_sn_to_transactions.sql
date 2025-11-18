USE snifer_db;

-- Add sn column to transactions table
ALTER TABLE transactions 
ADD COLUMN sn VARCHAR(255) DEFAULT NULL COMMENT 'Serial number dari response transaksi sukses' 
AFTER response_data;

