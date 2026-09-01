"use client";

import { useEffect, useRef } from "react";
import { runPanelSweep } from "@/lib/glyph/sweep";

/**
 * Any group of frames that should arrive as panels.
 *
 * `revision` rebuilds the sweep: the shots grid passes its column count, because
 * crossing the breakpoint rebuilds the columns and the observer has to be
 * rebuilt with them or it spends the rest of the page watching frames that are
 * no longer in the document. An unfolding entry passes its open state, because
 * frames that were collapsed when the effect ran were never observed.
 */
export function PanelField({
  revision,
  className,
  style,
  children,
}: {
  revision?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    return runPanelSweep(host);
  }, [revision]);

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
