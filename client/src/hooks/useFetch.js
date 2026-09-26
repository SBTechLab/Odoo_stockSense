import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom data fetching hook with loading, error states, and manual refetch.
 * @param {Function} fetcher Async function returning { data, meta? }
 * @param {Array} [deps=[]] Dependencies triggering auto-refetch
 * @returns {{ data: any, meta: any, loading: boolean, error: any, refetch: () => Promise<void>, setData: Function }}
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (isMounted.current) {
        setData(res?.data !== undefined ? res.data : res);
        setMeta(res?.meta || null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, meta, loading, error, refetch: execute, setData };
}
