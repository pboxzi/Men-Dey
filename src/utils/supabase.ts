/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaG5kamR4dnh0b3plbWVzc3ZzeSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzMzc5NjY2LCJleHAiOjIwNTg5NTU2NjZ9.xBwAJvQPKyGNQO-BaBhclFF-ZM5bOW-0xI4LBHy2dkk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'kr_supabase_auth',
  },
});
