"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api-client";

type ApiResourceState<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  mutate: () => void;
};

export function useApiResource<T>(url: string, initialData: T): ApiResourceState<T> {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const mutate = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const nextData = await fetchApi<T>(url);
        if (isMounted) setData(nextData);
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Gagal mengambil data.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [url, refreshKey]);

  return { data, error, isLoading, mutate };
}
