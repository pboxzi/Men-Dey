-- Align database schema with frontend expectations
-- Add missing columns to experience_requests

ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS experience_id text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS booking_reference text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS meeting_venue text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS virtual_link text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS dress_code text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS arrival_instructions text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS cancelled_reason text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS timeline text;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
