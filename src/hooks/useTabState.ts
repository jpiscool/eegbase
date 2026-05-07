"use client";

import { useCallback, useSyncExternalStore, useEffect, useRef } from "react";

/**
 * URL + localStorage hybrid tab-state hook.
 *
 * Resolution order on first render:
 *   1. ?<urlKey>= in the URL (deep links / refresh on a tab)
 *   2. localStorage[storageKey] (returning visitor on bare /demo)
 *   3. defaultValue
 *
 * On change (synchronously, inside the click handler):
 *   • Updates URL via history.replaceState (preserves Next.js __NA marker)
 *   • Mirrors to localStorage
 *   • Dispatches "tabstatechange" so all consumers stay in sync
 *
 * Surface area:
 *   • Survives Safari/iOS bfcache via the `pageshow` event (e.persisted)
 *   • Cross-tab sync via the native "storage" event
 *   • SSR-safe — server snapshot returns defaultValue, no hydration mismatch
 *   • Tear-free reads via useSyncExternalStore (React 19 concurrent-safe)
 */

type Options<T extends string> = {
  urlKey: string;
  storageKey?: string;
  defaultValue: T;
  /**
   * Optional server-provided initial value. When the page is rendered as a
   * server component that reads searchParams, pass the resolved value here so
   * `getServerSnapshot` returns it — making the SSR HTML match the URL on
   * first paint (zero flash on refresh).
   */
  serverInitialValue?: T;
  validate?: (value: string) => boolean;
};

const TAB_STATE_EVENT = "tabstatechange";

export function useTabState<T extends string>({
  urlKey,
  storageKey,
  defaultValue,
  serverInitialValue,
  validate,
}: Options<T>): [T, (next: T) => void] {
  const isValid = useCallback(
    (v: string | null | undefined): v is string =>
      typeof v === "string" && v.length > 0 && (!validate || validate(v)),
    [validate],
  );

  // Read current value from URL → storage → default. Client-only.
  const read = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get(urlKey);
      if (isValid(fromUrl)) return fromUrl as T;
      if (storageKey) {
        const fromStorage = window.localStorage.getItem(storageKey);
        if (isValid(fromStorage)) return fromStorage as T;
      }
    } catch {
      /* localStorage may throw in private mode / partitioned storage */
    }
    return defaultValue;
  }, [urlKey, storageKey, defaultValue, isValid]);

  // Subscribe to URL / storage / bfcache / in-tab updates.
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const handler = () => onChange();
    const pageshow = (e: PageTransitionEvent) => {
      // Re-read when Safari restores from bfcache (e.persisted=true)
      if (e.persisted) onChange();
    };
    window.addEventListener("popstate", handler);
    window.addEventListener("pageshow", pageshow);
    window.addEventListener("storage", handler);
    window.addEventListener(TAB_STATE_EVENT, handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("pageshow", pageshow);
      window.removeEventListener("storage", handler);
      window.removeEventListener(TAB_STATE_EVENT, handler);
    };
  }, []);

  // Server snapshot must be stable. If the consumer passed a server-side
  // resolved value (from searchParams), use it — that way SSR HTML matches the
  // URL exactly. Otherwise fall back to defaultValue.
  const getServerSnapshot = useCallback((): T => serverInitialValue ?? defaultValue, [serverInitialValue, defaultValue]);

  const value = useSyncExternalStore(subscribe, read, getServerSnapshot);

  // After mount: if URL is bare but localStorage has a value, lift it into
  // the URL so a refresh keeps that tab. Bare /demo → /demo?tab=schedule.
  const lifted = useRef(false);
  useEffect(() => {
    if (lifted.current) return;
    lifted.current = true;
    if (typeof window === "undefined" || !storageKey) return;
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.get(urlKey)) {
        const fromStorage = window.localStorage.getItem(storageKey);
        if (isValid(fromStorage) && fromStorage !== defaultValue) {
          url.searchParams.set(urlKey, fromStorage);
          window.history.replaceState(window.history.state, "", url.toString());
          window.dispatchEvent(new Event(TAB_STATE_EVENT));
        }
      }
    } catch {
      /* ignore */
    }
  }, [urlKey, storageKey, defaultValue, isValid]);

  const setValue = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return;
      try {
        const url = new URL(window.location.href);
        if (next === defaultValue) {
          url.searchParams.delete(urlKey);
        } else {
          url.searchParams.set(urlKey, next);
        }
        // Synchronous URL update — happens before any paint, so a click→refresh
        // race never lands on the previous tab.
        window.history.replaceState(window.history.state, "", url.toString());
        if (storageKey) {
          window.localStorage.setItem(storageKey, next);
        }
      } catch {
        /* ignore quota / private mode */
      }
      // The native "storage" event only fires cross-tab. Notify in-tab listeners.
      window.dispatchEvent(new Event(TAB_STATE_EVENT));
    },
    [urlKey, storageKey, defaultValue],
  );

  return [value, setValue];
}
