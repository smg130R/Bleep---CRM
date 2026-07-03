-- Add employeeNumber column and populate sequentially
ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeNumber" INTEGER;

-- Populate existing users ordered by id
UPDATE users SET "employeeNumber" = sub.seq FROM (
  SELECT id, row_number() OVER (ORDER BY id) AS seq FROM users
) sub WHERE users.id = sub.id;
