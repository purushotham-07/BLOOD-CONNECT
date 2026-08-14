import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal fetch hook: runs `fn` on mount (and when `deps` change), tracking
 * loading/error/data. `load` can be called manually to re-fetch.
 */
export default function useApi(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fnRef.current();
      setData(res?.data?.data ?? res?.data ?? res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData, setError, reload: run };
}