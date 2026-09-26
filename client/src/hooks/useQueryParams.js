import { useSearchParams } from 'react-router';
import { useCallback, useMemo } from 'react';

/**
 * Hook to read and update URL search query parameters easily.
 * @returns {{ params: Record<string, string>, getParam: (key: string, defaultVal?: string) => string, setParam: (key: string, val: any) => void, setParams: (newParams: Record<string, any>) => void, removeParam: (key: string) => void }}
 */
export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const result = {};
    for (const [key, value] of searchParams.entries()) {
      result[key] = value;
    }
    return result;
  }, [searchParams]);

  const getParam = useCallback(
    (key, defaultVal = '') => {
      return searchParams.get(key) ?? defaultVal;
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setParams = useCallback(
    (newParams) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(newParams)) {
          if (v === undefined || v === null || v === '') {
            next.delete(k);
          } else {
            next.set(k, String(v));
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const removeParam = useCallback(
    (key) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(key);
        return next;
      });
    },
    [setSearchParams]
  );

  return { params, getParam, setParam, setParams, removeParam, searchParams };
}
