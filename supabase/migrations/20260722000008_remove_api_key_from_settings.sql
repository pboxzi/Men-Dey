-- Remove API key from site_settings (it should only be a Supabase secret)
DELETE FROM site_settings WHERE key = 'resend_api_key';
