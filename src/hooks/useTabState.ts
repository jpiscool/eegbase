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
  /**
   * Optional cookie name. When provided, the value is mirrored to a same-site
   * cookie alongside the URL/localStorage update. The server can then read this
   * cookie when ?<urlKey>= is missing (e.g. when DuckDuckGo or another browser
   * strips the query parameter on refresh) and SSR the correct tab.
   */
  cookieName?: string;
  /** Cookie max-age in seconds. Default: 30 days. */
  cookieMaxAge?: number;
  defaultValue: T;
  /**
   * Optional server-provided initial value. When the page is rendered as a
   * server component that reads searchParams + cookies, pass the resolved value
   * here so `getServerSnapshot` returns it — making the SSR HTML match the URL
   * on first paint (zero flash on refresh).
   */
  serverInitialValue?: T;
  validate?: (value: string) => boolean;
};

const TAB_STATE_EVENT = "tabstatechange";

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  // Path=/ makes it readable by every route on the site.
  // SameSite=Lax keeps it sent on same-origin navigations + top-level GETs.
  // No Secure flag — we want this on http://localhost too.
  const v = encodeURIComponent(value);
  document.cookie = `${name}=${v}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = name + "=";
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      try { return decodeURIComponent(part.slice(prefix.length)); } catch { return null; }
    }
  }
  return null;
}

export function useTabState<T extends string>({
  urlKey,
  storageKey,
  cookieName,
  cookieMaxAge = 60 * 60 * 24 * 30, // 30 days
  defaultValue,
  serverInitialValue,
  validate,
}: Options<T>): [T, (next: T) => void] {
  const isValid = useCallback(
    (v: string | null | undefined): v is string =>
      typeof v === "string" && v.length > 0 && (!validate || validate(v)),
    [validate],
  );

  // Read current value from URL → cookie → storage → default. Client-only.
  const read = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get(urlKey);
      if (isValid(fromUrl)) return fromUrl as T;
      if (cookieName) {
        const fromCookie = readCookie(cookieName);
        if (isValid(fromCookie)) return fromCookie as T;
      }
      if (storageKey) {
        const fromStorage = window.localStorage.getItem(storageKey);
        if (isValid(fromStorage)) return fromStorage as T;
      }
    } catch {
      /* localStorage may throw in private mode / partitioned storage */
    }
    return defaultValue;
  }, [urlKey, cookieName, storageKey, defaultValue, isValid]);

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
        if (cookieName) {
          // Cookie is the SSR-readable fallback. If the URL gets stripped by a
          // privacy browser (DuckDuckGo, Brave Strict, etc.), the server still
          // sees this on the next request and renders the right tab.
          writeCookie(cookieName, next, cookieMaxAge);
        }
      } catch {
        /* ignore quota / private mode */
      }
      // The native "storage" event only fires cross-tab. Notify in-tab listeners.
      window.dispatchEvent(new Event(TAB_STATE_EVENT));
    },
    [urlKey, storageKey, cookieName, cookieMaxAge, defaultValue],
  );

  return [value, setValue];
}
