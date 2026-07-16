const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = fs.readFileSync(path.join(__dirname, 'full-migration.sql'), 'utf-8');

// Try multiple pooler hostnames to find the right one
const hosts = [
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-us-east-2.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-us-west-1.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-us-west-2.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-eu-west-1.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-eu-west-2.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
  { host: 'aws-0-ap-southeast-2.pooler.supabase.com', port: 6543, user: 'postgres.wmhndjdxvxtozeyesvsy' },
];

const password = process.env.PGPASSWORD || '7KCtBrTNd9MVeaxu';

async function tryHost(config) {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT 1');
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    await pool.end();
    return false;
  }
}

async function run() {
  for (const config of hosts) {
    process.stdout.write(`Trying ${config.host}... `);
    const ok = await tryHost(config);
    if (ok) {
      console.log('CONNECTED!');
      console.log(`\nUse this in .env:`);
      console.log(`PGHOST="${config.host}"`);
      console.log(`PGPORT="${config.port}"`);
      console.log(`PGUSER="${config.user}"`);
      
      // Run migration
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: 'postgres',
        user: config.user,
        password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      const client = await pool.connect();
      try {
        console.log('\nRunning migration + seed...');
        await client.query(sql);
        console.log('SUCCESS! All tables created and seeded.');
      } catch (err) {
        console.error('SQL Error:', err.message);
      } finally {
        client.release();
        await pool.end();
      }
      return;
    } else {
      console.log('failed');
    }
  }
  console.log('\nNone of the pooler endpoints worked. Run the SQL manually in Supabase SQL Editor.');
}

run();
