import {useCallback, useEffect, useState} from 'react';

import {useAuth} from '../auth/AuthContext';
import {supabase} from '../lib/supabase';

export interface UnreadCounts {
  messages: number;
  notifications: number;
  refresh: () => Promise<void>;
}

export function useUnreadCounts(): UnreadCounts {
  const {session} = useAuth();
  const me = session?.user.id ?? null;
  const [messages, setMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);

  const refresh = useCallback(async () => {
    if (!me) {
      setMessages(0);
      setNotifications(0);
      return;
    }
    try {
      const [msgs, notifs] = await Promise.all([
        supabase
          .from('management_messages')
          .select('id', {count: 'exact', head: true})
          .is('read_at', null)
          .neq('sender_id', me),
        supabase
          .from('notifications')
          .select('id', {count: 'exact', head: true})
          .is('read_at', null),
      ]);
      setMessages(msgs.count ?? 0);
      setNotifications(notifs.count ?? 0);
    } catch {
      // counts are non-critical; keep last known values
    }
  }, [me]);

  useEffect(() => {
    void refresh();
    if (!me) return;
    const channel = supabase
      .channel(`unread-${me}`)
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'management_messages'}, () => {
        void refresh();
      })
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'notifications'}, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me, refresh]);

  return {messages, notifications, refresh};
}
