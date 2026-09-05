/**
 * Frames: what the matrix is asked to hold.
 *
 * A frame is one value per grid position, row-major, 0 to 1. Where it comes
 * from — an album cover, a stamped numeral, an empty field — is the only thing
 * that changes between the faces the site wears.
 *
 * A frame says how present each cell is, and that is all it says. What a
 * present cell is *filled with* is a separate question, and one this file
 * answers only for a picture that belongs to somebody else: see `artwork`.
 */

export function emptyFrame(grid: number): Float32Array {
  return new Float32Array(grid * grid);
}

/**
 * How much of each tail is spent on the stretch.
 *
 * Two percent at each end, rather than the true darkest and brightest cell. A
 * cover is a photograph, and a photograph has specular highlights and black
 * corners: taking the extremes literally would let one white glint out of two
 * thousand cells set the top of the range and leave every real tone crushed
 * into the bottom of it. Two percent of 2304 cells is about forty-six, which
 * is enough to be a highlight rather than an artefact.
 */
const TAIL = 0.02;

/**
 * How little range there has to be before there is nothing to bring out.
 *
 * A cover that is genuinely one flat colour has no tonal information in it, and
 * stretching it would amplify the JPEG's own noise into a field of speckle that
 * looks like a picture and is not. Below this the luma is handed back as it
 * came: an honest grey disc.
 */
const FLAT = 0.05;

/** Where the middle of the picture is put. */
const MID = 0.5;

/**
 * How far the midtone correction is allowed to go.
 *
 * The gamma that lands a cover's median on `MID` is unbounded as the median
 * approaches either end, and a cover that is 90% night sky wants an exponent
 * that would turn its few lit cells into a white haze. Clamped, a very dark
 * cover comes up as far as it can and stays recognisably dark.
 */
const GAMMA_MIN = 0.45;
const GAMMA_MAX = 2.2;

/**
 * How hard the edges are pulled out of the neighbourhood.
 *
 * A 48-cell grid is a heavy downsample and the box-average that produces it is
 * a blur; local contrast is the first thing it takes and the first thing a
 * face needs back. Half the difference from the 3x3 mean is the most that can
 * be added before the dots start ringing around every boundary — measured
 * against eleven real covers in a headless instance, where 0.65 began to look
 * like noise on flat artwork and 1.0 put haloes on gradients.
 */
const EDGE = 0.5;

/** Rec. 601 luma — the standard weighting for perceived brightness. */
function luma(pixels: Uint8ClampedArray, count: number): Float32Array {
  const values = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    values[i] = (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255;
  }
  return values;
}

/** The value standing at `at` through a sorted frame, interpolated. */
function quantile(sorted: Float32Array, at: number): number {
  const place = (sorted.length - 1) * at;
  const low = Math.floor(place);
  const high = Math.ceil(place);
  return sorted[low] + (sorted[high] - sorted[low]) * (place - low);
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Adds back the difference between a cell and the mean of its neighbours.
 *
 * The neighbourhood is clipped at the frame's edge rather than wrapped or
 * mirrored: the disc's outermost cells are culled by the circle anyway, so the
 * corners this is least careful about are corners nobody sees.
 */
function sharpen(values: Float32Array, grid: number, amount: number): Float32Array {
  const out = new Float32Array(values.length);
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      let sum = 0;
      let seen = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r >= grid || c < 0 || c >= grid) continue;
          sum += values[r * grid + c];
          seen++;
        }
      }
      const at = row * grid + col;
      out[at] = clamp01(values[at] + amount * (values[at] - sum / seen));
    }
  }
  return out;
}

/**
 * An album cover, as one value per cell — and as much of the picture as 48
 * cells of pure value can be made to hold.
 *
 * It used to be Rec. 601 luma and nothing else, which is a correct measurement
 * and an unreadable picture. Most covers live in a narrow band of the range:
 * put through a straight luma, eleven real sleeves came back as featureless
 * grey discs in a headless capture — the information was not lost in the
 * resolution, it was lost in the mapping, because nothing here was using more
 * than a third of the range available to it.
 *
 * Three steps, each undoing a different way the picture was being flattened,
 * and all three derived from this frame rather than tuned to any one cover:
 *
 *   1. *Levels.* The 2nd and 98th percentiles of this cover are pulled to black
 *      and white, so every sleeve arrives using the whole range instead of
 *      whatever part of it the photographer happened to expose for.
 *   2. *Midtone.* A gamma that lands this cover's median at mid grey. Without
 *      it a night-time cover stretches into a picture that is still almost all
 *      shadow, and a high-key one into one that is still almost all paper.
 *   3. *Local contrast.* The downsample is a blur, and a face at 48 cells is
 *      mostly edges. Half the difference from each cell's neighbourhood is put
 *      back — see `EDGE` for why that much and not more.
 *
 * A cover with no range in it is returned untouched; see `FLAT`.
 *
 * This is where the picture is *derived*. Nothing here knows about dots,
 * floors, or which skin is in force — `lib/glyph/pixel.ts` and the per-skin
 * floors own that, they were measured separately, and a legibility problem
 * fixed by moving a floor would have been a legibility problem moved onto
 * every other field on the site.
 */
export function artFrame(pixels: Uint8ClampedArray, grid: number): Float32Array {
  const values = luma(pixels, grid * grid);

  const sorted = Float32Array.from(values).sort();
  const floor = quantile(sorted, TAIL);
  const ceiling = quantile(sorted, 1 - TAIL);
  if (ceiling - floor < FLAT) return values;

  const range = ceiling - floor;
  /* Where the median lands once the stretch has been applied — read off the
     sorted frame rather than by sorting the stretched one, because a linear
     stretch cannot reorder anything. */
  const median = clamp01((quantile(sorted, 0.5) - floor) / range);
  const gamma =
    median > 0.02 && median < 0.98
      ? Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, Math.log(MID) / Math.log(median)))
      : 1;

  for (let i = 0; i < values.length; i++) {
    const stretched = clamp01((values[i] - floor) / range);
    values[i] = gamma === 1 ? stretched : Math.pow(stretched, gamma);
  }

  return sharpen(values, grid, EDGE);
}

/**
 * A cover, as the disc actually holds it: its tone, and its own colour.
 *
 * The disc used to keep only the tone and throw the colour away — a cover
 * arrived as a grey dither, and the argument for it was that value is the one
 * thing this palette trades in. That argument is overruled, and it was the
 * wrong one to make: the site is monochrome because its *tokens* are, and a
 * sleeve is no more the site's to recolour than a company's logo is. The marks
 * in the hero settled this already. Nothing here spends a hue on the design
 * system; it declines to spend one on somebody else's artwork.
 *
 * `tone` is `artFrame` unchanged — levels, midtone, local contrast — and it is
 * still what makes a sleeve legible at this size. `colour` is each cell's own
 * average RGB, re-exposed until its luma is the tone the correction asked for.
 *
 * Re-exposure rather than a curve per channel, and that is the whole of why
 * this is still the artwork. A gain is one multiplier on all three channels, so
 * the ratios between them survive it exactly: hue and saturation come out
 * untouched and only the exposure moves. Running the levels curve down R, G and
 * B separately would have shifted every colour on the cover towards grey, which
 * is the dither again with more steps.
 *
 * Two honest costs, stated:
 *
 *   - A gain that would take a channel past 255 clips it, and a clipped channel
 *     loses a little saturation. It happens where the correction is lifting a
 *     dark cover hard, and the alternative — refusing to lift it — is a black
 *     disc.
 *   - A near-black cell has almost no colour to scale, so the epsilon floor on
 *     its luma keeps the gain finite rather than inventing a hue out of noise.
 *     Such a cell comes out near-black, which is what it is.
 */
export type Artwork = {
  tone: Float32Array;
  /** Three bytes per cell, row-major: red, green, blue. */
  colour: Uint8ClampedArray;
};

/**
 * The darkest luma a cell can be read at before the gain stops being a gain.
 *
 * Below this a cell is three channels of sensor noise, and dividing by it would
 * multiply that noise by a hundred and hand back a saturated colour that is not
 * in the picture.
 */
const BLACK = 0.02;

export function artwork(pixels: Uint8ClampedArray, grid: number): Artwork {
  const count = grid * grid;
  const tone = artFrame(pixels, grid);
  const brightness = luma(pixels, count);
  const colour = new Uint8ClampedArray(count * 3);

  for (let i = 0; i < count; i++) {
    const gain = tone[i] / Math.max(brightness[i], BLACK);
    const p = i * 4;
    const at = i * 3;
    colour[at] = pixels[p] * gain;
    colour[at + 1] = pixels[p + 1] * gain;
    colour[at + 2] = pixels[p + 2] * gain;
  }

  return { tone, colour };
}
