import 'dotenv/config';

const url = process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

// Try multiple methods to create the table
async function main() {
  // Method 1: Try RPC
  console.log('Method 1: RPC exec_sql...');
  try {
    const r = await fetch(url + '/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ query: 'CREATE TABLE IF NOT EXISTS membership_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, status TEXT NOT NULL DEFAULT \'pending\' CHECK (status IN (\'pending\',\'active\',\'expired\',\'cancelled\')), tier_id TEXT NOT NULL, tier_name TEXT NOT NULL, tier_price TEXT, card_name TEXT NOT NULL, card_serial TEXT, member_name TEXT, member_email TEXT, member_phone TEXT, member_country TEXT, profile_photo TEXT, comm_method TEXT CHECK (comm_method IN (\'whatsapp\',\'email\')), membership_number TEXT, activation_date TIMESTAMPTZ, expiration_date TIMESTAMPTZ, cancel_reason TEXT, admin_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());' })
    });
    const txt = await r.text();
    console.log('  Status:', r.status, txt.substring(0, 200));
    if (r.ok) { console.log('  Table created via RPC!'); return; }
  } catch(e) { console.log('  Failed:', e.message); }

  // Method 2: Try direct Supabase SQL via raw query
  console.log('Method 2: REST SQL...');
  try {
    const r = await fetch(url + '/rest/v1/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'params=single-object' },
      body: JSON.stringify({ query: 'CREATE TABLE IF NOT EXISTS membership_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, status TEXT NOT NULL DEFAULT \'pending\' CHECK (status IN (\'pending\',\'active\',\'expired\',\'cancelled\')), tier_id TEXT NOT NULL, tier_name TEXT NOT NULL, tier_price TEXT, card_name TEXT NOT NULL, card_serial TEXT, member_name TEXT, member_email TEXT, member_phone TEXT, member_country TEXT, profile_photo TEXT, comm_method TEXT CHECK (comm_method IN (\'whatsapp\',\'email\')), membership_number TEXT, activation_date TIMESTAMPTZ, expiration_date TIMESTAMPTZ, cancel_reason TEXT, admin_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());' })
    });
    const txt2 = await r.text();
    console.log('  Status:', r.status, txt2.substring(0, 200));
  } catch(e2) { console.log('  Failed:', e2.message); }

  console.log('\nCould not create table automatically.');
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('CREATE TABLE IF NOT EXISTS membership_requests (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  user_id UUID NOT NULL,');
  console.log("  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),");
  console.log('  tier_id TEXT NOT NULL,');
  console.log('  tier_name TEXT NOT NULL,');
  console.log('  tier_price TEXT,');
  console.log('  card_name TEXT NOT NULL,');
  console.log('  card_serial TEXT,');
  console.log('  member_name TEXT,');
  console.log('  member_email TEXT,');
  console.log('  member_phone TEXT,');
  console.log('  member_country TEXT,');
  console.log('  profile_photo TEXT,');
  console.log("  comm_method TEXT CHECK (comm_method IN ('whatsapp','email')),");
  console.log('  membership_number TEXT,');
  console.log('  activation_date TIMESTAMPTZ,');
  console.log('  expiration_date TIMESTAMPTZ,');
  console.log('  cancel_reason TEXT,');
  console.log('  admin_notes TEXT,');
  console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMPTZ DEFAULT NOW()');
  console.log(');');
  process.exit(0);
}
main();
