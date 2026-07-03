-- Add BDA sheet tab name columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "assignedSheetTab" TEXT DEFAULT 'Sheet1';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "prospectSheetTab" TEXT DEFAULT 'Sheet1';
