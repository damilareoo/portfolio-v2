/**
 * The field, and what may be written on it.
 *
 * Kept apart from lib/pad.ts because the pad itself runs in a browser and the
 * register runs on a server. Everything here is pure and imports nothing, so
 * the component that draws a field and the route that stores one agree on the
 * encoding by sharing it rather than by both being careful. The store, the
 * salted hash and the rate limit stay in lib/pad.ts, which reaches for
 * node:crypto and must never be pulled into a client bundle.
 */

/* ---- what a drawing is ------------------------------------------------- */

/** The field is the site's own: twelve by twelve, the instruments' pitch. */
export const PAD_GRID = 12;
export const PAD_CELLS = PAD_GRID * PAD_GRID;

/**
 * One drawing, encoded as 144 bits in 36 hex characters.
 *
 * A bitfield rather than an array of booleans because this is the whole of what
 * gets stored, sent, and read back: 36 bytes a drawing means the register's
 * forty entries are a kilobyte and a half of JSON, which is a payload the page
 * can carry without thinking about it. Row-major, four cells to a character,
 * most significant bit first — the same order a frame is read in.
 */
export type Drawing = {
  id: string;
  cells: string;
  /** Empty when the visitor stayed anonymous, which is the default. */
  signature: string;
  at: number;
};

export type Comment = {
  id: string;
  body: string;
  name: string;
  at: number;
};

export type Register = { drawings: Drawing[]; comments: Comment[] };

/** Free text, and how much of it. The only free text in the game. */
export const SIGNATURE_MAX = 24;
export const NAME_MAX = 24;
export const COMMENT_MAX = 500;

/* ---- the bitfield ------------------------------------------------------ */

const HEX_LENGTH = PAD_CELLS / 4;
const CELLS_PATTERN = new RegExp(`^[0-9a-f]{${HEX_LENGTH}}$`);

export function encodeCells(cells: readonly boolean[]): string {
  let out = "";
  for (let i = 0; i < PAD_CELLS; i += 4) {
    let nibble = 0;
    for (let bit = 0; bit < 4; bit++) if (cells[i + bit]) nibble |= 8 >> bit;
    out += nibble.toString(16);
  }
  return out;
}

/** Null for anything that is not exactly one field, which is the only shape. */
export function decodeCells(hex: string): boolean[] | null {
  if (typeof hex !== "string" || !CELLS_PATTERN.test(hex)) return null;
  const cells = new Array<boolean>(PAD_CELLS).fill(false);
  for (let i = 0; i < HEX_LENGTH; i++) {
    const nibble = Number.parseInt(hex[i], 16);
    for (let bit = 0; bit < 4; bit++) cells[i * 4 + bit] = (nibble & (8 >> bit)) !== 0;
  }
  return cells;
}

/** A field with nothing on it is not a drawing, and is refused as one. */
export function hasMark(hex: string): boolean {
  return /[1-9a-f]/.test(hex);
}

/** The frame the glyph engine wants: one value per cell, row-major, 0 or 1. */
export function padFrame(cells: readonly boolean[]): Float32Array {
  const frame = new Float32Array(PAD_CELLS);
  for (let i = 0; i < PAD_CELLS; i++) frame[i] = cells[i] ? 1 : 0;
  return frame;
}

/* ---- the free text ----------------------------------------------------- */

/* Control characters, the soft hyphen, the bidirectional marks, overrides and
   isolates, the zero-width family, the byte-order mark, and ordinary
   whitespace — all of which collapse to a single space below.

   Written as escapes rather than as the characters themselves, and that is not
   a style preference: a literal U+202E in a source file reverses the line it
   sits on in every editor that renders it, so a pattern written to catch that
   trick would be the one line in the repository performing it. */
const INVISIBLE =/[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\s]+/g;

/**
 * What a submitted string is allowed to be.
 *
 * Whitespace of every kind collapses to a single space, and that does three
 * jobs at once: it stops a signature being drawn as a column of newlines down
 * the register, it removes the zero-width and directional characters that let
 * one name impersonate another or reverse the line it sits on, and it makes the
 * character count a count of characters somebody can see. Counted in code
 * points rather than UTF-16 units, so an emoji costs one against the cap and
 * not two.
 *
 * Nothing is escaped here. React escapes on render and that is where escaping
 * belongs; a value escaped on the way *in* is stored wrong forever and comes
 * back double-escaped the first time anything reads it.
 */
export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.replace(INVISIBLE, " ").trim();
}

export function withinLength(value: string, max: number): boolean {
  return [...value].length <= max;
}
