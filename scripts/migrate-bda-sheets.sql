-- Migration: Add BDA sheet URLs and prospects table
-- Run this in Supabase Dashboard > SQL Editor

-- Add sheet URL columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "assignedSheetUrl" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "prospectSheetUrl" TEXT;

-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  "bdaId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "customerName" TEXT NOT NULL,
  contact TEXT NOT NULL,
  college TEXT,
  branch TEXT,
  year TEXT,
  status TEXT DEFAULT 'Prospect' CHECK (status IN ('Prospect','Registration Done','Follow-up Needed','Converted','Lost')),
  remarks TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD')
);

CREATE INDEX IF NOT EXISTS idx_prospects_bda ON prospects("bdaId");
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access prospects" ON prospects;
CREATE POLICY "Service role full access prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);
