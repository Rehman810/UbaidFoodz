"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RunOptions = { background?: boolean };

export function usePoll<T>(fetcher: () => Promise<T>, intervalMs = 15000, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasDataRef = useRef(false);

  const run = useCallback(
    async (opts?: RunOptions) => {
      if (!enabled) return;
      const background = opts?.background ?? false;
      if (!background) {
        if (!hasDataRef.current) setLoading(true);
        else setRefreshing(true);
      }
      try {
        const result = await fetcher();
        setData(result);
        hasDataRef.current = true;
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetcher, enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void run();
    const id = setInterval(() => void run({ background: true }), intervalMs);
    const onBranch = () => void run();
    window.addEventListener("branch-change", onBranch);
    return () => {
      clearInterval(id);
      window.removeEventListener("branch-change", onBranch);
    };
  }, [run, intervalMs, enabled]);

  const refresh = useCallback(() => run(), [run]);

  return { data, loading, refreshing, error, refresh };
}
