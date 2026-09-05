"use client";

import { useEffect, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { emptyFrame } from "@/lib/glyph/glyphs";

const GRID = 25;
const SIZE = 300;

/** The bar's geometry inside the field, in cells. */
const BAR_ROWS = 3;
const BAR_MARGIN = 3;
const CYCLE_MS = 1400;

/**
 * A bar of the same pixels everything else is made of, filling and refilling.
 *
 * It is the phone's battery and timer glyphs, borrowed for the one thing this
 * site actually has to say while a route is on its way: that it is working.
 *
 * It reports no percentage, and it deliberately loops rather than creeping to
 * 99 and stopping. A navigation has no progress to read — there is no number
 * to be had — and a bar that implied one would be inventing it. What it says
 * is "still going", which is the truth and the whole of it.
 */
function barFrame(fill: number): Float32Array {
  const frame = emptyFrame(GRID);
  const width = GRID - BAR_MARGIN * 2;
  const top = Math.round((GRID - BAR_ROWS) / 2);
  const lit = Math.round(width * Math.min(1, Math.max(0, fill)));

  for (let row = top; row < top + BAR_ROWS; row++) {
    for (let i = 0; i < width; i++) {
      // The unlit remainder stays visible — the bar is a track, not a void.
      frame[row * GRID + BAR_MARGIN + i] = i < lit ? 1 : 0.22;
    }
  }
  return frame;
}

export function GlyphLoading({ label = "Loading" }: { label?: string }) {
  const [frame, setFrame] = useState<Float32Array>(() => barFrame(0));

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setFrame(barFrame(((now - start) % CYCLE_MS) / CYCLE_MS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <GlyphCell
        grid={GRID}
        size={SIZE}
        frame={frame}
        label={`${label}…`}
        className="w-[180px] text-ink"
      />
      <p
        role="status"
        className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3"
      >
        {label}
      </p>
    </div>
  );
}
