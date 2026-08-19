/**
 * The visitor's own glyph: how it is stored, and how it becomes a field.
 *
 * The forge writes it and the home's hidden page reads it, so the format and
 * the key live here rather than in either — a drawing saved by one and refused
 * by the other would be the site losing something a person made.
 *
 * The encoding is one character per cell, and deliberately the dullest thing
 * that works. It is a value in someone else's browser that outlives every
 * deploy, so it has to be readable by a version of this site nobody has written
 * yet, and legible to anyone who opens their own storage and looks at it.
 */

/** Dots across. The forge and the hidden page are the same field. */
export const GRID = 25;

const CELLS = GRID * GRID;

/** Where the drawing lives. */
export const STORAGE_KEY = "glyph-forge";

/**
 * And a flag saying this browser has already been counted.
 *
 * Separate from the drawing on purpose: clearing the drawing is something a
 * visitor does often and means nothing, while having drawn at all happens once.
 * Tying the count to the drawing's existence would let a redraw inflate it.
 */
export const COUNTED_KEY = "glyph-forge-counted";

export function encodeGlyph(cells: Uint8Array): string {
  let out = "";
  for (let i = 0; i < CELLS; i++) out += cells[i] ? "1" : "0";
  return out;
}

/**
 * A stored drawing, or null if what was stored is not one.
 *
 * Everything that is not exactly a drawing is refused rather than repaired.
 * Storage is the one input the site cannot vouch for — an older format, a
 * half-written value, another site on the same origin — and a drawing guessed
 * at from junk would be a stranger's marks presented as the visitor's own.
 */
export function decodeGlyph(raw: string | null): Uint8Array | null {
  if (raw === null || raw.length !== CELLS) return null;
  const cells = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    const c = raw[i];
    if (c !== "0" && c !== "1") return null;
    cells[i] = c === "1" ? 1 : 0;
  }
  return cells;
}

/**
 * Which drawing the hidden page carries: the visitor's, or the one it shipped with.
 *
 * An empty drawing is not a drawing. A visitor who cleared the forge and walked
 * away left nothing to show, and a blank fourth page would read as the
 * instrument breaking rather than as the mark it falls back to — so emptiness
 * is treated as absence, and absence falls back.
 */
export function markGlyph(stored: Uint8Array | null, authored: Uint8Array): Uint8Array {
  return stored?.some(Boolean) ? stored : authored;
}

/** A drawing as a field: a cell is lit or it is not, and there is no between. */
export function glyphFrame(cells: Uint8Array): Float32Array {
  const frame = new Float32Array(CELLS);
  for (let i = 0; i < CELLS; i++) frame[i] = cells[i] ? 1 : 0;
  return frame;
}
