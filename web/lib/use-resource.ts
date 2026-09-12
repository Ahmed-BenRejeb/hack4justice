"use client";

/**
 * Client-side loading of one backend resource, with optional polling.
 *
 * Polling is sequential (the next request is scheduled only after the previous one settles),
 * so a slow backend never accumulates overlapping requests.
 */
import { useCallback, useEffect, useEffectEvent, useState } from "react";

interface LoadedState<T> {
  key: string | null;
  data: T | undefined;
  error: unknown;
  updatedAt: Date | null;
}

/** What a component reads from `useResource`. */
export interface Resource<T> {
  data: T | undefined;
  /** The latest failure. Earlier data is kept alongside it, so a failed poll does not blank the screen. */
  error: unknown;
  /** True until the first response (success or failure) for the current key. */
  isLoading: boolean;
  updatedAt: Date | null;
  reload: () => void;
}

/**
 * Loads the resource identified by `key` with `load`, re-fetching every `intervalMs` when given.
 * A null key skips loading. Data belonging to a previous key is never returned.
 */
export function useResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  intervalMs?: number,
): Resource<T> {
  const [state, setState] = useState<LoadedState<T>>({
    key: null,
    data: undefined,
    error: undefined,
    updatedAt: null,
  });
  const [reloadCount, setReloadCount] = useState(0);
  // Latest `load` without re-running the effect when callers pass an inline function.
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async (): Promise<void> => {
      try {
        const data = await runLoad(controller.signal);
        if (controller.signal.aborted) return;
        setState({ key, data, error: undefined, updatedAt: new Date() });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) =>
          previous.key === key
            ? { ...previous, error }
            : { key, data: undefined, error, updatedAt: null },
        );
      }
      if (intervalMs !== undefined) timer = setTimeout(() => void tick(), intervalMs);
    };

    void tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, intervalMs, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const isCurrent = state.key === key;

  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : undefined,
    isLoading: key !== null && !isCurrent,
    updatedAt: isCurrent ? state.updatedAt : null,
    reload,
  };
}
