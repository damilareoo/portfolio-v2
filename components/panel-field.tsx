"use client";

import { useEffect, useRef } from "react";
import { runPanelSweep } from "@/lib/glyph/sweep";

/**
 * Any group of frames that should arrive as panels.
 *
 * `revision` rebuilds the sweep: the shots grid passes its column count, because
 * crossing the breakpoint rebuilds the columns and the observer has to be
 * rebuilt with them or it spends the rest of the page watching frames that are
 * no longer in the document. An unfolding entry passes whether it has ever been
 * opened, because frames that were collapsed when the effect ran were never
 * observed — and because a revision that came back down would rebuild the
 * observer mid-collapse and sweep arrived frames a second time. A revision
 * moves in one direction, or it is not an arrival.
 *
 * `rootMargin` is passed straight to the sweep's observer, and only a caller
 * whose frames are full-bleed has any business setting it. Omitted, it is the
 * shots grid's 220px lead, unchanged.
 */
export function PanelField({
  revision,
  rootMargin,
  className,
  style,
  children,
}: {
  revision?: string | number;
  /** How far outside the viewport frames start arriving. Defaults to the sweep's own. */
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    return runPanelSweep(host, { rootMargin });
  }, [revision, rootMargin]);

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
