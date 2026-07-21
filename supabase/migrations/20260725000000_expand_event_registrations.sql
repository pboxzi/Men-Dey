ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS special_requests TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS communication_method TEXT DEFAULT 'email';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS confirmed_date TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS confirmed_time TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS confirmed_location TEXT DEFAULT '';
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
