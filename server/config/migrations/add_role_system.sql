-- Migration: Add Role System
-- Date: 2024

USE tds_db;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nama role (admin, member)',
  display_name VARCHAR(100) NOT NULL COMMENT 'Nama tampilan role',
  description TEXT DEFAULT NULL COMMENT 'Deskripsi role',
  permissions JSON DEFAULT NULL COMMENT 'Permissions dalam format JSON array',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT DEFAULT NULL COMMENT 'User yang memberikan role ini',
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id),
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles (hanya admin dan member)
INSERT INTO roles (name, display_name, description, permissions) VALUES
('admin', 'Administrator', 'Full access to all features', 
  '["*"]'),
('member', 'Member', 'Standard member with basic access', 
  '["transactions:read", "transactions:create", "history:read", "logs:read"]')
ON DUPLICATE KEY UPDATE name=name;

-- Assign admin role to existing admin user (if exists)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'admin'
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Assign member role to all other users (if any)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username != 'admin' AND r.name = 'member'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
)
ON DUPLICATE KEY UPDATE user_id=user_id;

