-- Configure Resend email settings
INSERT INTO site_settings (key, value, "group") VALUES
  ('resend_api_key', 're_6xzVEcdw_MK4r1djyzf9RYnYXj9aGkbv1', 'email'),
  ('resend_sender_email', 'notifications@cmagency.me', 'email'),
  ('email_notifications_enabled', 'true', 'email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
