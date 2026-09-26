import { useState, useEffect } from 'react';

/**
 * Debounce a rapidly changing value.
 * @param {any} value Value to debounce
 * @param {number} [delay=300] Debounce delay in ms
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
