-- Single active session tracking for admin login
CREATE TABLE IF NOT EXISTS admin_active_sessions (
  user_id text PRIMARY KEY DEFAULT 'master_admin',
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_active_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_active_sessions' AND policyname = 'allow all on admin_active_sessions'
  ) THEN
    CREATE POLICY "allow all on admin_active_sessions" ON admin_active_sessions FOR ALL USING (true);
  END IF;
END $$;
