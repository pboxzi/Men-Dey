const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase PostgreSQL...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_create_tables.sql'),
      'utf-8'
    );
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration complete.');

    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8'
    );
    console.log('Running seed...');
    await client.query(seedSQL);
    console.log('Seed complete.');

    console.log('All done.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
