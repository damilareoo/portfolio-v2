"use client";

import { useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEY, decodeGlyph } from "@/lib/glyph/forge";

/**
 * The drawing this browser is holding, as React is allowed to read it.
 *
 * Storage is a store outside React that the server cannot see, and
 * `useSyncExternalStore` is what makes that honest: the server and the
 * hydrating client both render no drawing, the real one arrives on the first
 * client pass, and nothing has to reach for `setState` inside an effect to
 * bring it in.
 *
 * Subscribing is not ceremony either. The `storage` event fires in a tab when
 * *another* tab writes, so a glyph drawn in the colophon appears on the home
 * open in the next window over, without either page polling for it.
 *
 * Two surfaces read this — the forge that writes it and the hidden page that
 * shows it — so it lives here rather than in whichever of them was written
 * first.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function snapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The server has no storage to read, and says so rather than guessing. */
function serverSnapshot(): string | null {
  return null;
}

export function useStoredGlyph(): Uint8Array | null {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => decodeGlyph(raw), [raw]);
}
