-- Migration: Add role_id to users table
-- Date: 2024

USE tds_db;

-- Add role_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id INT DEFAULT NULL 
COMMENT 'Role ID (foreign key to roles table)'
AFTER password;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Migrate existing data from user_roles to users.role_id
-- Set role_id based on first role in user_roles (prioritize admin)
UPDATE users u
SET u.role_id = (
  SELECT ur.role_id
  FROM user_roles ur
  INNER JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = u.id
  ORDER BY CASE r.name 
    WHEN 'admin' THEN 1 
    WHEN 'member' THEN 2 
    ELSE 3 
  END
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- Set default role_id to 'member' for users without role
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'member' LIMIT 1)
WHERE role_id IS NULL;

