/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaG5kamR4dnh0b3pleWVzdnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTE0MDEsImV4cCI6MjA5ODE2NzQwMX0.wvOU5QgLYoXMxz9-P0GEYP-M5lus6mq9CkMNF3VYucI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'kr_supabase_auth',
  },
});
