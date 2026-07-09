ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '';
ALTER TABLE calling_sheet ADD COLUMN IF NOT EXISTS whatsapp TEXT;

DO $$ BEGIN
  -- Drop any CHECK constraint on leads.status
  EXECUTE (
    SELECT 'ALTER TABLE leads DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'leads'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
    LIMIT 1
  );
END $$;
