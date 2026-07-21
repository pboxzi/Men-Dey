-- Make admin_events publicly readable (admin-only write stays)
DROP POLICY IF EXISTS "Admins can read admin_events" ON admin_events;
DROP POLICY IF EXISTS "Admins can manage admin_events" ON admin_events;

CREATE POLICY "Anyone can read admin_events" ON admin_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert admin_events" ON admin_events
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin_events" ON admin_events
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete admin_events" ON admin_events
  FOR DELETE USING (is_admin());

-- Add description column if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_events' AND column_name = 'description') THEN
    ALTER TABLE admin_events ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Add capacity column if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_events' AND column_name = 'capacity') THEN
    ALTER TABLE admin_events ADD COLUMN capacity integer DEFAULT 100;
  END IF;
END $$;

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES admin_events(id) ON DELETE CASCADE,
  event_title text,
  event_day text,
  event_month text,
  event_location text,
  event_time text,
  user_id text,
  member_name text NOT NULL,
  member_email text NOT NULL,
  ticket_type text DEFAULT 'general',
  ticket_qty integer DEFAULT 1,
  selected_seat text,
  ticket_ref text,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert event_registrations" ON event_registrations;
CREATE POLICY "Anyone can insert event_registrations" ON event_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own event_registrations" ON event_registrations;
CREATE POLICY "Users can read own event_registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can read all event_registrations" ON event_registrations;
CREATE POLICY "Admins can read all event_registrations" ON event_registrations
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage event_registrations" ON event_registrations;
CREATE POLICY "Admins can manage event_registrations" ON event_registrations
  FOR ALL USING (is_admin());
