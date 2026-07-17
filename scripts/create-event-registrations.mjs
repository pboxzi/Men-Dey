import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  family: 4,
});

const sql = `
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL DEFAULT '',
  event_day TEXT NOT NULL DEFAULT '',
  event_month TEXT NOT NULL DEFAULT '',
  event_location TEXT NOT NULL DEFAULT '',
  event_time TEXT NOT NULL DEFAULT '',
  member_name TEXT NOT NULL DEFAULT '',
  member_email TEXT NOT NULL DEFAULT '',
  member_phone TEXT NOT NULL DEFAULT '',
  member_country TEXT NOT NULL DEFAULT '',
  communication_method TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  status_text TEXT NOT NULL DEFAULT 'Pending',
  admin_notes TEXT NOT NULL DEFAULT '',
  registration_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all" ON event_registrations;
CREATE POLICY "public_all" ON event_registrations FOR ALL TO public USING (true);
`;

async function run() {
  try {
    const client = await pool.connect();
    console.log('Connected to database.');
    await client.query(sql);
    console.log('Table created/verified successfully.');
    client.release();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

run();
