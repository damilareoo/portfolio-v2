"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Step = "s" | "m" | "l";

/* The dials write real tokens. Density retunes spacing and radii across every
   surface; type scale moves the root font size, which every rem-based size
   inherits. Nothing here is decorative — these are the site's own variables. */
export const DENSITY: Record<Step, { gap: string; pad: string; window: string; tile: string }> = {
  s: { gap: "10px", pad: "14px", window: "12px", tile: "8px" },
  m: { gap: "16px", pad: "20px", window: "16px", tile: "12px" },
  l: { gap: "24px", pad: "28px", window: "20px", tile: "16px" },
};

export const TYPE_SCALE: Record<Step, string> = { s: "0.9", m: "1", l: "1.12" };

const STORAGE_KEY = "dialkit";

type Settings = { density: Step; typeScale: Step };
const DEFAULTS: Settings = { density: "m", typeScale: "m" };

function apply({ density, typeScale }: Settings) {
  const root = document.documentElement;
  const d = DENSITY[density] ?? DENSITY.m;
  root.style.setProperty("--pg-gap", d.gap);
  root.style.setProperty("--pad", d.pad);
  root.style.setProperty("--radius-window", d.window);
  root.style.setProperty("--radius-tile", d.tile);
  root.style.setProperty("--type-scale", TYPE_SCALE[typeScale] ?? "1");
}

/* Where the settings actually live is localStorage, not React: the pre-paint
   script below reads them before React exists, and a second tab can change them
   while this one is open. So they are read as an external store — the server
   renders the defaults, the client re-renders with the saved values after
   hydration, and nothing has to write state from inside an effect. */

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const saved = JSON.parse(raw) as Partial<Settings>;
    return {
      density: saved.density ?? DEFAULTS.density,
      typeScale: saved.typeScale ?? DEFAULTS.typeScale,
    };
  } catch {
    // Corrupt storage just means defaults.
    return DEFAULTS;
  }
}

/* Cached, because getSnapshot runs on every render and must hand back the same
   object until the settings truly change or React re-renders without end. */
let snapshot: Settings = DEFAULTS;
let stale = true;

function getSnapshot(): Settings {
  if (stale) {
    try {
      snapshot = parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      // Private browsing — this visit runs on the defaults.
      snapshot = DEFAULTS;
    }
    stale = false;
  }
  return snapshot;
}

// The server has no storage to read, so it renders what a first visit sees.
const getServerSnapshot = (): Settings => DEFAULTS;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// A dial turned in another tab is a change arriving from outside; the DOM here
// has to be retuned to match it, since no local write did it for us.
function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  stale = true;
  apply(getSnapshot());
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// One place applies and persists, so no update can race another. The initial
// apply is the pre-paint script's job — it reads this same key and these same
// maps, which is why nothing needs re-applying on mount.
function write(next: Settings) {
  snapshot = next;
  stale = false;
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing — the setting still applies for this session.
  }
  emit();
}

type SettingsValue = Settings & {
  setDensity: (s: Step) => void;
  setTypeScale: (s: Step) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDensity = useCallback((density: Step) => write({ ...getSnapshot(), density }), []);
  const setTypeScale = useCallback((typeScale: Step) => write({ ...getSnapshot(), typeScale }), []);

  const value = useMemo(
    () => ({ ...settings, setDensity, setTypeScale }),
    [settings, setDensity, setTypeScale],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

// Runs before paint so tuned values never flash at their defaults.
export const settingsScript = `(function(){try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");var D=${JSON.stringify(
  DENSITY,
)};var T=${JSON.stringify(
  TYPE_SCALE,
)};var d=D[s.density]||D.m;var r=document.documentElement;r.style.setProperty("--pg-gap",d.gap);r.style.setProperty("--pad",d.pad);r.style.setProperty("--radius-window",d.window);r.style.setProperty("--radius-tile",d.tile);r.style.setProperty("--type-scale",T[s.typeScale]||"1");}catch(e){}})();`;
