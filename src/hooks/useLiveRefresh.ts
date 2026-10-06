import {useEffect} from 'react';

import {onRowsChanged} from '../lib/realtime';

/**
 * Re-run `refresh` whenever any of `tables` changes for the signed-in user
 * (Realtime, RLS-scoped). The tables argument is compared by value, so an
 * inline array literal is safe.
 */
export function useLiveRefresh(refresh: () => void, tables: string[]): void {
  const key = tables.join(',');
  useEffect(() => {
    const list = key.split(',').filter(Boolean);
    return onRowsChanged(list, refresh);
  }, [key, refresh]);
}
