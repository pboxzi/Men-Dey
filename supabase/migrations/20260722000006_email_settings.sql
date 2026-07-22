-- Configure Resend email settings
INSERT INTO site_settings (key, value, "group") VALUES
  ('resend_api_key', 're_UPLdvVyV_gXMEPXAsF6VxbdviXMNYLr5B', 'email'),
  ('resend_sender_email', 'admin@cmagency.me', 'email'),
  ('email_notifications_enabled', 'true', 'email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
