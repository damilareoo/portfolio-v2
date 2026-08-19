/**
 * The maker's mark: the glyph the hidden page carries before anyone draws.
 *
 * It is written as art rather than as six hundred and twenty-five numbers
 * because it is a drawing, and a drawing that cannot be read in the file is a
 * drawing nobody will ever correct. The array is derived from it at module
 * load; the art is the source, and `#` is a lit dot.
 *
 * The lockup is the apostrophe and the D the site is titled with — the fourth
 * face of an instrument, signed by whoever built it, and the one page the
 * visitor's own drawing replaces.
 */

const ART = [
  ".........................",
  ".........................",
  ".........................",
  ".......##................",
  ".......##................",
  ".......##................",
  "......##.................",
  "........#########........",
  "........###########......",
  "........############.....",
  "........###.......##.....",
  "........###.......##.....",
  "........###........##....",
  "........###........##....",
  "........###........##....",
  "........###........##....",
  "........###........##....",
  "........###.......##.....",
  "........###.......##.....",
  "........############.....",
  "........###########......",
  "........#########........",
  ".........................",
  ".........................",
  ".........................",
] as const;

/** 625 entries, one per cell of the 25×25 field, row by row. */
export const authoredGlyph: number[] = ART.flatMap((row) =>
  [...row].map((cell) => (cell === "#" ? 1 : 0)),
);
