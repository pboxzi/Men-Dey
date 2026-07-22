import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wmhndjdxvxtozeyesvsy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaG5kamR4dnh0b3pleWVzdnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU5MTQwMSwiZXhwIjoyMDk4MTY3NDAxfQ.0gnLj8Vii-4pX2ThF5aP7NCW1bQIVtccn1hWDjCbHLU'
);

console.log('=== CONVERSATIONS ===');
const { data: convs } = await supabase.from('ask_gillian_conversations').select('*').order('created_at', { ascending: false });
convs?.forEach(c => console.log(`  [${c.id}] user=${c.user_id} status=${c.status}`));

console.log('\n=== MESSAGES ===');
const { data: msgs } = await supabase.from('ask_gillian_messages').select('*').order('created_at', { ascending: true });
msgs?.forEach(m => console.log(`  [${m.id}] conv=${m.conversation_id.slice(0,8)} sender=${m.sender} text="${m.text}" read=${m.read}`));

console.log('\n=== PROFILES ===');
const userIds = convs?.map(c => c.user_id) || [];
if (userIds.length > 0) {
  const { data: profiles } = await supabase.from('profiles').select('id, name, email, role').in('id', userIds);
  profiles?.forEach(p => console.log(`  [${p.id.slice(0,8)}] name="${p.name}" email="${p.email}" role=${p.role}`));
}
