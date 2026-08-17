"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * intempus tints its colophon by hue. A monochrome site cannot, so the same
 * mechanic moves one axis over: the field blends **weight × contrast** and
 * writes the result into the site's own token variables.
 *
 * State lives in a provider mounted in the root layout, so a committed blend
 * survives client-side navigation and dies on refresh — which is exactly the
 * behaviour the reference has, and Law 3 besides.
 */
export type Blend = { weight: number; contrast: number };

/** The scatter. Landmarks, not decoration — the cursor blends between these. */
export const LANDMARKS: (Blend & { name: string; x: number; y: number })[] = [
  { name: "Fog", weight: 300, contrast: 0.06, x: 0.12, y: 0.84 },
  { name: "Hairline", weight: 300, contrast: 0.3, x: 0.27, y: 0.46 },
  { name: "Manual", weight: 400, contrast: 0.5, x: 0.5, y: 0.5 },
  { name: "Record", weight: 450, contrast: 0.42, x: 0.62, y: 0.68 },
  { name: "Specimen", weight: 450, contrast: 0.78, x: 0.74, y: 0.24 },
  { name: "Plate", weight: 500, contrast: 0.96, x: 0.9, y: 0.1 },
  { name: "Draft", weight: 350, contrast: 0.62, x: 0.36, y: 0.2 },
  { name: "Proof", weight: 500, contrast: 0.34, x: 0.84, y: 0.62 },
];

export const NEUTRAL: Blend = { weight: 400, contrast: 0.5 };

/** Inverse-distance weighting, so the named points actually govern the field. */
export function blendAt(x: number, y: number): Blend {
  let weight = 0;
  let contrast = 0;
  let total = 0;

  for (const point of LANDMARKS) {
    const d = Math.hypot(x - point.x, y - point.y);
    if (d < 0.001) return { weight: point.weight, contrast: point.contrast };
    const w = 1 / (d * d);
    weight += point.weight * w;
    contrast += point.contrast * w;
    total += w;
  }

  return { weight: weight / total, contrast: contrast / total };
}

/**
 * The mid-ladder tokens are re-derived as blends between the ground and the ink
 * of whichever skin is active, so one control works in both without knowing
 * which is on.
 *
 * The blending is left to CSS rather than done in JS: `color-mix` reads
 * `var(--bg)` and `var(--text-1)` at paint time, so switching skin under a held
 * blend re-derives the ladder for free and nothing has to watch for it.
 */
function apply({ weight, contrast }: Blend) {
  const root = document.documentElement;
  const lerp = (from: number, to: number) => from + (to - from) * contrast;
  const step = (ratio: number) =>
    `color-mix(in srgb, var(--text-1) ${(ratio * 100).toFixed(1)}%, var(--bg))`;

  root.style.setProperty("--body-weight", String(Math.round(weight)));
  root.style.setProperty("--text-2", step(lerp(0.42, 0.74)));
  root.style.setProperty("--text-3", step(lerp(0.18, 0.46)));
  root.style.setProperty("--border", step(lerp(0.05, 0.24)));
}

function clear() {
  const root = document.documentElement;
  for (const prop of ["--body-weight", "--text-2", "--text-3", "--border"]) {
    root.style.removeProperty(prop);
  }
}

type FieldValue = {
  committed: Blend | null;
  preview: (blend: Blend | null) => void;
  commit: (blend: Blend | null) => void;
};

const FieldContext = createContext<FieldValue | null>(null);

export function ValueFieldProvider({ children }: { children: ReactNode }) {
  const [committed, setCommitted] = useState<Blend | null>(null);

  /* Previews are transient and deliberately not state — writing them through
     React would re-render the whole tree on every pointer move. */
  const preview = useCallback(
    (blend: Blend | null) => {
      if (blend) apply(blend);
      else if (committed) apply(committed);
      else clear();
    },
    [committed],
  );

  const commit = useCallback((blend: Blend | null) => {
    setCommitted(blend);
    if (blend) apply(blend);
    else clear();
  }, []);

  const value = useMemo(() => ({ committed, preview, commit }), [committed, preview, commit]);

  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}

export function useValueField() {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error("useValueField must be used inside ValueFieldProvider");
  return ctx;
}
