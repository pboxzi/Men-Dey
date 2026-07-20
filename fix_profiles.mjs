import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const { data: { users }, error } = await supabase.auth.admin.listUsers();
if (error) { console.error(error.message); process.exit(1); }

for (const u of users) {
  const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
  if (!p) {
    const name = u.user_metadata?.name || u.email?.split('@')[0] || 'Fan';
    await supabase.from('profiles').insert({ id: u.id, name, email: u.email, role: 'user' });
    console.log(u.email + ': profile created with name "' + name + '"');
    continue;
  }
  const correctName = u.user_metadata?.name || u.email?.split('@')[0] || 'Fan';
  if (p.name !== correctName) {
    await supabase.from('profiles').update({ name: correctName }).eq('id', u.id);
    console.log(u.email + ': name fixed from "' + p.name + '" to "' + correctName + '"');
  } else {
    console.log(u.email + ': name OK ("' + p.name + '")');
  }
}

process.exit(0);
