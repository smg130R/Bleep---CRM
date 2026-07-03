-- Migration: Add payment tracking and extended fields to prospects table
-- Run this in Supabase Dashboard > SQL Editor

-- Add new columns
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS month TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'slot_booking', 'partial_paid', 'fully_paid', 'cancelled'));
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS slot_amount NUMERIC DEFAULT 0;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS remaining NUMERIC DEFAULT 0;

-- Drop old status check constraint and add new one with expanded options
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check 
  CHECK (status IN ('Prospect', 'Follow-up', 'NA', 'NI', 'Call Back', 'Registration Done', 'Converted', 'Lost'));
