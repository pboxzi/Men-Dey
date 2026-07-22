-- Configure Resend email settings
INSERT INTO site_settings (key, value, "group") VALUES
  ('resend_api_key', 're_A5YdWEpJ_6dTCKFP8gb923QfWA6vLXhqg', 'email'),
  ('resend_sender_email', 'notifications@cmagency.me', 'email'),
  ('email_notifications_enabled', 'true', 'email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
