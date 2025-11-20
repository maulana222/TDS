-- Migration: Add Digiflazz settings columns to user_settings table
-- Date: 2025-01-XX

ALTER TABLE user_settings 
ADD COLUMN digiflazz_username VARCHAR(255) DEFAULT NULL COMMENT 'Username untuk Digiflazz API' AFTER digiprosb_endpoint,
ADD COLUMN digiflazz_api_key VARCHAR(255) DEFAULT NULL COMMENT 'API Key untuk Digiflazz API' AFTER digiflazz_username,
ADD COLUMN digiflazz_endpoint VARCHAR(500) DEFAULT 'https://api.digiflazz.com/v1/transaction' COMMENT 'Endpoint Digiflazz API' AFTER digiflazz_api_key;

