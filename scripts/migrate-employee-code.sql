-- Add employeeCode column
ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;

-- Set existing users with sequential codes (AD-001, AD-002, etc.)
UPDATE users SET "employeeCode" = sub.code FROM (
  SELECT id, 'AD-' || LPAD(row_number() OVER (ORDER BY id)::TEXT, 3, '0') AS code FROM users
) sub WHERE users.id = sub.id;
