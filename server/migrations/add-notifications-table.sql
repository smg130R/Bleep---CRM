-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','danger','ping')),
  "isRead" BOOLEAN DEFAULT FALSE,
  "linkTo" TEXT,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications("userId", "isRead") WHERE NOT "isRead";

-- RLS (service role)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
