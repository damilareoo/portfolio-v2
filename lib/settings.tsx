"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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

type SettingsValue = Settings & {
  setDensity: (s: Step) => void;
  setTypeScale: (s: Step) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  // Guards the first render from writing defaults over saved values.
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>;
        setSettings({
          density: saved.density ?? DEFAULTS.density,
          typeScale: saved.typeScale ?? DEFAULTS.typeScale,
        });
      }
    } catch {
      // Corrupt or unavailable storage just means defaults.
    }
    hydrated.current = true;
  }, []);

  // One place applies and persists, so no update can race another.
  useEffect(() => {
    if (!hydrated.current) return;
    apply(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Private browsing — the setting still applies for this session.
    }
  }, [settings]);

  const setDensity = useCallback(
    (density: Step) => setSettings((prev) => ({ ...prev, density })),
    [],
  );
  const setTypeScale = useCallback(
    (typeScale: Step) => setSettings((prev) => ({ ...prev, typeScale })),
    [],
  );

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
