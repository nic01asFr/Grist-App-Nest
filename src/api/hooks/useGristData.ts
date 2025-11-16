/**
 * React Hook for Grist Data
 */

import { useState, useEffect } from 'react';
import { gristAPI } from '../gristAPI';
import type { GristRecord } from '@core/types';

export function useGristData<T extends GristRecord = GristRecord>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await gristAPI.getData<T>(tableName);

        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [tableName]);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await gristAPI.getData<T>(tableName);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
