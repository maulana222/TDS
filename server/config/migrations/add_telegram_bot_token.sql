-- Migration: Add telegram_bot_token column to user_settings table
-- Date: 2024

USE snifer_db;

-- Add telegram_bot_token column if it doesn't exist
        ALTER TABLE user_settings 
        ADD COLUMN IF NOT EXISTS telegram_bot_token VARCHAR(255) DEFAULT NULL 
        COMMENT 'Telegram Bot Token untuk mengirim pesan via Bot API'
        AFTER digiprosb_endpoint;

