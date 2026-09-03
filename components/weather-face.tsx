// components/weather-face.tsx
"use client";

import { useMemo } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { weatherFrame, type WeatherFace as Face } from "@/lib/glyph/weather-frames";

const GRID = 21;

/* Canvas units, not pixels. `GlyphCell` builds its lattice in this space and
   sizes its backing store from it; the canvas itself is laid out at `w-full`,
   so CSS decides how large the disc is drawn and this decides how finely. The
   same 300 the disc and the pedometer already use — at the 64 this once passed
   the backing store was 128px, which the wall's larger cells would have
   stretched into a blur. */
const SIZE = 300;

/**
 * Lagos weather on a disc of the site's own cells.
 *
 * The frame is memoised on the face rather than rebuilt each render: it is
 * arithmetic over a fixed grid and cannot change while the reading does not.
 *
 * It takes no size. The disc fills the square it is given; see `SIZE`.
 */
export function WeatherFace({ face }: { face: Face }) {
  const frame = useMemo(() => weatherFrame(face, GRID), [face]);

  return (
    <GlyphCell
      grid={GRID}
      size={SIZE}
      shape="circle"
      pixel="round"
      /* A sun, a cloud, four rain strokes: figures, not a photograph. A value
         here says where the marks are, and a mark is a mark on either skin —
         so it must not flip. Left on the default `luminance` the light skin
         inverted the whole field and drew a solid black disc with a
         cloud-shaped hole punched out of it. */
      polarity="ink"
      frame={frame}
      label="Lagos weather"
      className="w-full"
    />
  );
}
