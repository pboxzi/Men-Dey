-- Migration 005: Expand experience_requests for full booking flow

-- Personal information columns
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';

-- Booking information columns
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS preferred_date TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS preferred_time TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 1;
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS special_requests TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS communication_method TEXT DEFAULT 'email';

-- Admin confirmation columns
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS confirmed_date TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS confirmed_time TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS confirmed_location TEXT DEFAULT '';
ALTER TABLE experience_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
