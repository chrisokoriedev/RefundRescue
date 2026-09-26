import { useState, useEffect, useCallback } from 'react';

const cache = new Map<string, any>();

export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  // If we already have the data in cache, use it as initial state
  const [data, setData] = useState<T | null>(() => {
    return (cache.get(key) as T) || null;
  });
  
  // Only loading initially if we don't have cached data
  const [loading, setLoading] = useState<boolean>(!cache.has(key));
  const [error, setError] = useState<any>(null);

  const fetchAndCache = useCallback(
    async (force = false) => {
      // If not forced and data is in cache, skip loading
      if (!force && cache.has(key)) {
        setData(cache.get(key));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await fetcher();
        cache.set(key, result);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ...dependencies]
  );

  useEffect(() => {
    fetchAndCache();
  }, [fetchAndCache]);

  return { 
    data, 
    loading, 
    error, 
    mutate: (newData?: T) => {
      if (newData !== undefined) {
        cache.set(key, newData);
        setData(newData);
      } else {
        fetchAndCache(true);
      }
    } 
  };
}
