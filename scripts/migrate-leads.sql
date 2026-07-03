-- Migration: Add leads tracking for team lead workspace
-- Run this in Supabase Dashboard > SQL Editor

-- Add master sheet URL to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS "masterSheetUrl" TEXT;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  contact TEXT NOT NULL,
  college TEXT,
  branch TEXT,
  year TEXT,
  status TEXT DEFAULT 'unassigned' CHECK (status IN ('unassigned','assigned','na','ni','form_shared','screenshot_shared','busy','switch_off','out_of_service','dropped')),
  "naCount" INTEGER DEFAULT 0,
  "assignedInMaster" BOOLEAN DEFAULT FALSE,
  "currentAssigneeId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD')
);

-- Lead assignments history
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  "leadId" INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  "assignedTo" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "assignedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "assignedDate" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  status TEXT,
  remarks TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_team ON leads("teamId");
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assignee ON leads("currentAssigneeId");
CREATE INDEX IF NOT EXISTS idx_assignments_lead ON lead_assignments("leadId");
CREATE INDEX IF NOT EXISTS idx_assignments_bda ON lead_assignments("assignedTo");

-- Add leadId and naCount to calling_sheet
ALTER TABLE calling_sheet ADD COLUMN IF NOT EXISTS "leadId" INTEGER REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE calling_sheet ADD COLUMN IF NOT EXISTS "naCount" INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_calling_lead ON calling_sheet("leadId");

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access leads" ON leads;
CREATE POLICY "Service role full access leads" ON leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access lead_assignments" ON lead_assignments;
CREATE POLICY "Service role full access lead_assignments" ON lead_assignments FOR ALL USING (true) WITH CHECK (true);
