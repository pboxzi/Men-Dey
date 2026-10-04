import {supabase} from './supabase';

/**
 * Subscribe to INSERTs on a table (RLS-scoped for the current user).
 * Returns a cleanup function.
 */
export function onRowInserted(table: string, cb: () => void): () => void {
  const channel = supabase
    .channel(`inserts-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', {event: 'INSERT', schema: 'public', table}, cb)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to UPDATEs on a table (RLS-scoped), optionally filtered by a
 * column equality filter string such as `conversation_id=eq.<uuid>`.
 */
export function onRowUpdated(table: string, filter: string | undefined, cb: () => void): () => void {
  const channel = supabase
    .channel(`updates-${table}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {event: 'UPDATE', schema: 'public', table, ...(filter ? {filter} : {})},
      cb,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
