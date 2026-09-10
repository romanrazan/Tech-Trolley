"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/client";

export function useApiData<T>(loader: () => Promise<T>, initial: T) {
  const load = useEffectEvent(loader);
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
      void load()
        .then((result) => {
          if (active) setData(result);
        })
        .catch((reason: unknown) => {
          if (active) setError(getApiErrorMessage(reason));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [version]);

  return { data, setData, loading, error, reload };
}
