ALTER TABLE users ADD COLUMN IF NOT EXISTS "targetCalls" INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS platform_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

INSERT INTO platform_config (key, value) VALUES ('cronTimeMorning', '14:30') ON CONFLICT (key) DO NOTHING;
INSERT INTO platform_config (key, value) VALUES ('cronTimeEvening', '17:30') ON CONFLICT (key) DO NOTHING;
INSERT INTO platform_config (key, value) VALUES ('minCallsTarget', '60') ON CONFLICT (key) DO NOTHING;
