"use client";

import { useEffect, useRef } from "react";
import { runPanelSweep } from "@/lib/glyph/sweep";

/**
 * Any group of frames that should arrive as panels.
 *
 * `revision` rebuilds the sweep: the shots field passes `shots.length`, because
 * a change to the feed rebuilds the mosaic and the observer has to be rebuilt
 * with it or it spends the rest of the page watching frames that are no longer
 * in the document. An unfolding entry passes whether it has ever been
 * opened, because frames that were collapsed when the effect ran were never
 * observed — and because a revision that came back down would rebuild the
 * observer mid-collapse and sweep arrived frames a second time. A revision
 * moves in one direction, or it is not an arrival.
 *
 * `rootMargin` is passed straight to the sweep's observer, and a caller whose
 * frames are large — full-bleed, or the full measure — sets it to "0px" so the
 * dissolve does not finish before the frame is on screen. Omitted, it is the
 * sweep's own 220px lead, which is the value a field of small tiles wants and
 * which nothing on the site currently asks for.
 *
 * `tone` goes to the sweep the same way and is the same kind of thing: an
 * escape hatch for one photograph, not a new default. It is a function, so a
 * caller passing it has to be a client component itself — which is the correct
 * shape of that requirement rather than an inconvenience, because a tone
 * correction is a rendering decision and rendering here happens in the browser.
 */
export function PanelField({
  revision,
  rootMargin,
  tone,
  className,
  style,
  children,
}: {
  revision?: string | number;
  /** How far outside the viewport frames start arriving. Defaults to the sweep's own. */
  rootMargin?: string;
  /** A last pass over each panel's values. See lib/glyph/sweep.ts. */
  tone?: (values: Float32Array) => Float32Array;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    return runPanelSweep(host, { rootMargin, tone });
  }, [revision, rootMargin, tone]);

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
