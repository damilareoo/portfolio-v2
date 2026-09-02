/**
 * The feed's composition: formless rather than authored.
 *
 * The reference this came from builds its mosaic by hand — every shot given a
 * column and row span in the markup. That produces a designed rhythm and a
 * decision to make every time a shot is added. This does not author sizes. A
 * shot's height is still its own aspect ratio; its width comes from a band
 * vocabulary chosen so that no two neighbours ever share one, which is what
 * makes the page read as organic instead of as a repeating pattern.
 *
 * Nothing here is random. A shuffled mosaic would hydrate into a different page
 * than the server rendered.
 */
export const COLUMNS = 12;

/**
 * Every band spans the full measure, and no band repeats a width side by side.
 * Two-item bands give the feed its big moments; three-item bands are its rests.
 */
export const BANDS: readonly (readonly number[])[] = [
  [7, 5],
  [4, 8],
  [3, 5, 4],
  [5, 7],
  [8, 4],
  [4, 3, 5],
];

export type Placed<T> = { item: T; span: number };

/** The widest single span, used when one shot is left over. */
const FULL = COLUMNS;

function pick(order: number, previousLast: number, remaining: number): readonly number[] {
  if (remaining === 1) return [FULL];
  const fits = BANDS.filter((band) => band.length <= remaining);
  const distinct = fits.filter((band) => band[0] !== previousLast);
  /* `distinct` is only empty if every band that fits opens on the width the
     last band closed on, which the vocabulary above makes impossible — but
     falling back to `fits` keeps a future edit to BANDS from throwing. */
  const pool = distinct.length > 0 ? distinct : fits;
  return pool[order % pool.length];
}

export function composeMosaic<T>(items: readonly T[]): Placed<T>[][] {
  const bands: Placed<T>[][] = [];
  let cursor = 0;
  let order = 0;
  let previousLast = 0;

  while (cursor < items.length) {
    const composition = pick(order, previousLast, items.length - cursor);
    const band = composition.map((span, i) => ({ item: items[cursor + i], span }));
    bands.push(band);
    cursor += composition.length;
    previousLast = composition[composition.length - 1];
    order += 1;
  }

  return bands;
}
