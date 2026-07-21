-- Drop and recreate event_registrations with the correct schema
-- The previous migration used CREATE TABLE IF NOT EXISTS, but the
-- table was pre-created with UUID columns, so the CREATE was a no-op.
-- No data exists yet, so this is safe.

DROP TABLE IF EXISTS event_registrations CASCADE;

CREATE TABLE event_registrations (
  id text PRIMARY KEY,
  event_id text NOT NULL,
  event_title text,
  event_day text,
  event_month text,
  event_location text,
  event_time text,
  user_id text,
  member_name text NOT NULL,
  member_email text NOT NULL,
  phone text DEFAULT '',
  country text DEFAULT '',
  special_requests text DEFAULT '',
  communication_method text DEFAULT 'email',
  ticket_type text DEFAULT 'general',
  ticket_qty integer DEFAULT 1,
  selected_seat text,
  ticket_ref text,
  status text DEFAULT 'pending',
  confirmed_date text DEFAULT '',
  confirmed_time text DEFAULT '',
  confirmed_location text DEFAULT '',
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert event_registrations" ON event_registrations;
CREATE POLICY "Anyone can insert event_registrations" ON event_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own event_registrations" ON event_registrations;
CREATE POLICY "Users can read own event_registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid()::text OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can read all event_registrations" ON event_registrations;
CREATE POLICY "Admins can read all event_registrations" ON event_registrations
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage event_registrations" ON event_registrations;
CREATE POLICY "Admins can manage event_registrations" ON event_registrations
  FOR ALL USING (is_admin());
