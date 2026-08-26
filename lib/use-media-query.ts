"use client";

import { useCallback, useSyncExternalStore } from "react";

/* A breakpoint is external state the same way the theme is: the browser owns
   it, the server cannot know it, and reading it with an effect would mean a
   state write after paint. matchMedia is already a store — subscribe, read,
   done — so it goes through useSyncExternalStore like everything else here.

   The server snapshot is the widest arrangement. The prerendered shell has no
   width to consult, and the full measure is the layout the page is composed
   for; a narrow browser corrects it on hydration, before any shot is visible. */
export function useMediaQuery(query: string, serverSnapshot = true) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverSnapshot,
  );
}
