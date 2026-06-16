-- API Logs
CREATE TABLE IF NOT EXISTS api_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  route text NOT NULL,
  method text NOT NULL,
  user_id text,
  ip text,
  status_code int,
  response_time_ms int,
  error_message text,
  created_at timestamp DEFAULT now()
);

-- IP Blocklist
CREATE TABLE IF NOT EXISTS ip_blocklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text UNIQUE NOT NULL,
  reason text,
  blocked_by text,
  blocked_at timestamp DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Suspicious Activity
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  user_id text,
  ip text,
  description text,
  severity text DEFAULT 'medium',
  resolved boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  key text PRIMARY KEY,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  updated_by text,
  updated_at timestamp DEFAULT now()
);

-- Platform Config (feature flags)
CREATE TABLE IF NOT EXISTS platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  type text DEFAULT 'string',
  description text,
  updated_by text,
  updated_at timestamp DEFAULT now()
);

-- Rate Limit Config
CREATE TABLE IF NOT EXISTS rate_limit_config (
  endpoint text PRIMARY KEY,
  limit_count int NOT NULL,
  window_seconds int NOT NULL,
  is_active boolean DEFAULT true,
  updated_by text,
  updated_at timestamp DEFAULT now()
);

-- Enable RLS (Service role can bypass, but good practice to secure them)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Admins only (Requires custom claims or service role, so we just block anon/authenticated)
-- All these tables should primarily be accessed via Server APIs using Service Role Key
CREATE POLICY "Deny all public access to admin tables" ON api_logs FOR ALL USING (false);
CREATE POLICY "Deny all public access to admin tables" ON ip_blocklist FOR ALL USING (false);
CREATE POLICY "Deny all public access to admin tables" ON suspicious_activity FOR ALL USING (false);
CREATE POLICY "Deny all public access to admin tables" ON email_templates FOR ALL USING (false);
CREATE POLICY "Deny all public access to admin tables" ON platform_config FOR ALL USING (false);
CREATE POLICY "Deny all public access to admin tables" ON rate_limit_config FOR ALL USING (false);
