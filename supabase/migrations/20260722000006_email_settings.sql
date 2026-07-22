-- Configure email settings (API key is stored as Supabase secret, not here)
INSERT INTO site_settings (key, value, "group") VALUES
  ('resend_sender_email', 'admin@cmagency.me', 'email'),
  ('email_notifications_enabled', 'true', 'email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
