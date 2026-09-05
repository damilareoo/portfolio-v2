// lib/glyph/weather-frames.ts
import { emptyFrame } from "@/lib/glyph/glyphs";
import type { Condition } from "@/lib/weather";

/**
 * The weather as the matrix draws it.
 *
 * Drawn with arithmetic rather than rasterised from a canvas, so the frames can
 * be produced on the server and asserted in a test — the canvas sources in
 * glyphs.ts need a browser, and an instrument that only exists at runtime is an
 * instrument nothing can hold to its word.
 *
 * Coordinates are fractions of the grid, so every shape scales to whatever disc
 * it is asked for.
 */
export type WeatherFace = Condition | "unreported";

export const WEATHER_FACES: readonly WeatherFace[] = [
  "clear",
  "partly",
  "cloudy",
  "rain",
  "storm",
  "haze",
  "unreported",
];

type Paint = { frame: Float32Array; grid: number };

function put({ frame, grid }: Paint, x: number, y: number, value: number) {
  const col = Math.round(x * (grid - 1));
  const row = Math.round(y * (grid - 1));
  if (col < 0 || col >= grid || row < 0 || row >= grid) return;
  const at = row * grid + col;
  if (value > frame[at]) frame[at] = value;
}

/** A filled disc, in grid fractions. */
function disc(paint: Paint, cx: number, cy: number, r: number, value = 1) {
  const step = 1 / (paint.grid - 1);
  for (let y = cy - r; y <= cy + r; y += step) {
    for (let x = cx - r; x <= cx + r; x += step) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(paint, x, y, value);
    }
  }
}

/** A horizontal run. */
function bar(paint: Paint, x0: number, x1: number, y: number, value = 1) {
  const step = 1 / (paint.grid - 1);
  for (let x = x0; x <= x1; x += step) put(paint, x, y, value);
}

/** A line between two points. */
function stroke(paint: Paint, x0: number, y0: number, x1: number, y1: number, value = 1) {
  const steps = Math.ceil(paint.grid * Math.hypot(x1 - x0, y1 - y0)) + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    put(paint, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, value);
  }
}

/** The cloud every overcast face is built from. */
function cloud(paint: Paint, cx: number, cy: number, scale: number, value = 1) {
  disc(paint, cx - 0.16 * scale, cy + 0.05 * scale, 0.13 * scale, value);
  disc(paint, cx + 0.02 * scale, cy - 0.06 * scale, 0.18 * scale, value);
  disc(paint, cx + 0.2 * scale, cy + 0.05 * scale, 0.14 * scale, value);
  bar(paint, cx - 0.3 * scale, cx + 0.32 * scale, cy + 0.17 * scale, value);
}

function sun(paint: Paint, cx: number, cy: number, r: number, value = 1) {
  disc(paint, cx, cy, r, value);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const from = r + 0.07;
    const to = r + 0.15;
    stroke(
      paint,
      cx + Math.cos(angle) * from,
      cy + Math.sin(angle) * from,
      cx + Math.cos(angle) * to,
      cy + Math.sin(angle) * to,
      value,
    );
  }
}

export function weatherFrame(face: WeatherFace, grid: number): Float32Array {
  const paint: Paint = { frame: emptyFrame(grid), grid };

  switch (face) {
    case "clear":
      sun(paint, 0.5, 0.5, 0.2);
      break;
    case "partly":
      sun(paint, 0.63, 0.34, 0.14, 0.55);
      cloud(paint, 0.44, 0.58, 1);
      break;
    case "cloudy":
      cloud(paint, 0.5, 0.44, 1.1);
      cloud(paint, 0.5, 0.68, 0.75, 0.5);
      break;
    case "rain":
      cloud(paint, 0.5, 0.4, 1);
      for (const x of [0.32, 0.46, 0.6, 0.74]) stroke(paint, x, 0.68, x - 0.05, 0.86, 0.75);
      break;
    case "storm":
      cloud(paint, 0.5, 0.38, 1);
      stroke(paint, 0.56, 0.6, 0.44, 0.74);
      stroke(paint, 0.44, 0.74, 0.56, 0.74);
      stroke(paint, 0.56, 0.74, 0.42, 0.9);
      break;
    case "haze":
      for (const [y, value] of [
        [0.36, 0.5],
        [0.48, 1],
        [0.6, 0.5],
        [0.72, 1],
      ] as const) {
        bar(paint, 0.24, 0.76, y, value);
      }
      break;
    case "unreported":
      /* Nothing. Not an omission — it is the whole of the answer, and it is the
         same answer the other three bays give when they have nothing to report.

         Four cells at the cardinals stood here, on the argument that an empty
         disc might read as broken where a mark reads as present. The mark was
         the wrong half of that argument: what says the instrument is present is
         the *field*, which `GlyphCell` draws at the skin's own floor whether
         anything is lit on it or not. So the four dots were a second statement
         of a thing the lattice was already saying, in a shape that resembled
         none of the six real faces and read as a loading state. A weather dial
         with no weather on it is a weather dial. */
      break;
  }

  return paint.frame;
}
