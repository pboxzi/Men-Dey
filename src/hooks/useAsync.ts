import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Minimal async loader with explicit loading / error / empty handling.
 * Re-runs only when the caller invalidates via `reload()` or its deps change.
 */
export function useAsync<T>(loader: () => Promise<{ data: T | null; error: string | null }>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  const alive = useRef(true);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loaderRef.current()
      .then((res) => {
        if (cancelled || !alive.current) return;
        setData(res.data);
        setError(res.error);
      })
      .catch((err: unknown) => {
        if (cancelled || !alive.current) return;
        setError(err instanceof Error ? err.message : 'Unexpected error');
      })
      .finally(() => {
        if (!cancelled && alive.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { data, loading, error, reload };
}
