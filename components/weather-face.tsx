// components/weather-face.tsx
"use client";

import { useMemo } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { weatherFrame, type WeatherFace as Face } from "@/lib/glyph/weather-frames";

const GRID = 21;

/**
 * Lagos weather on a disc of the site's own cells.
 *
 * The frame is memoised on the face rather than rebuilt each render: it is
 * arithmetic over a fixed grid and cannot change while the reading does not.
 */
export function WeatherFace({ face, size = 64 }: { face: Face; size?: number }) {
  const frame = useMemo(() => weatherFrame(face, GRID), [face]);

  return (
    <GlyphCell
      grid={GRID}
      size={size}
      shape="circle"
      pixel="round"
      frame={frame}
      label="Lagos weather"
      className="shrink-0"
    />
  );
}
