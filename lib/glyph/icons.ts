/**
 * The site's icon language: 7x5 is the alphabet, 7x7 is the icon.
 *
 * Seven cells square, for three reasons that agree. Odd, so it has a true
 * centre — a sun needs one and an even grid has to break its own symmetry to
 * find a middle. Five plus one above and one below, so an icon standing beside
 * a word inherits the letterform's optical alignment instead of being nudged.
 * And seven is the fewest cells that keeps a diagonal arrow and a chevron
 * distinct; at five they resolve to the same shape.
 *
 * Authored as seven rows of seven, laid out so the icon reads as a picture in
 * the source — the same hand font.ts draws its letters with.
 */
export const ICON_GRID = 7;

export type IconName =
  | "light"
  | "dark"
  | "system"
  | "arrow-out"
  | "arrow-left"
  | "arrow-right";

/**
 * Which reflections an icon claims. Declared rather than inferred, so the test
 * can catch a one-cell slip that is invisible in review and obvious on the page.
 */
export type Symmetry = "both" | "leftRight" | "topBottom" | "none";

export type Icon = { bits: number[]; symmetry: Symmetry };

export const ICONS: Record<IconName, Icon> = {
  // A hollow disc with four cardinal and four diagonal rays.
  light: {
    symmetry: "both",
    bits: [
      0,0,0,1,0,0,0,
      0,1,0,0,0,1,0,
      0,0,1,1,1,0,0,
      1,0,1,0,1,0,1,
      0,0,1,1,1,0,0,
      0,1,0,0,0,1,0,
      0,0,0,1,0,0,0,
    ],
  },

  // A crescent opening to the right. Mirrors top to bottom and not side to
  // side, which is what makes it a crescent rather than a bracket.
  dark: {
    symmetry: "topBottom",
    bits: [
      0,0,1,1,1,0,0,
      0,1,1,1,0,0,0,
      1,1,1,0,0,0,0,
      1,1,1,0,0,0,0,
      1,1,1,0,0,0,0,
      0,1,1,1,0,0,0,
      0,0,1,1,1,0,0,
    ],
  },

  // A display on a stand: "whatever the machine is doing".
  system: {
    symmetry: "leftRight",
    bits: [
      1,1,1,1,1,1,1,
      1,0,0,0,0,0,1,
      1,0,0,0,0,0,1,
      1,0,0,0,0,0,1,
      1,1,1,1,1,1,1,
      0,0,0,1,0,0,0,
      0,1,1,1,1,1,0,
    ],
  },

  /* Leaving for somewhere else: the head is the corner it is heading into and
     the shaft is the diagonal, which is the one arrow shape that reads at 7
     cells without an arrowhead of its own. */
  "arrow-out": {
    symmetry: "none",
    bits: [
      0,0,0,1,1,1,1,
      0,0,0,0,0,1,1,
      0,0,0,0,1,0,1,
      0,0,0,1,0,0,1,
      0,0,1,0,0,0,0,
      0,1,0,0,0,0,0,
      1,0,0,0,0,0,0,
    ],
  },

  "arrow-left": {
    symmetry: "topBottom",
    bits: [
      0,0,0,1,0,0,0,
      0,0,1,0,0,0,0,
      0,1,0,0,0,0,0,
      1,1,1,1,1,1,1,
      0,1,0,0,0,0,0,
      0,0,1,0,0,0,0,
      0,0,0,1,0,0,0,
    ],
  },

  "arrow-right": {
    symmetry: "topBottom",
    bits: [
      0,0,0,1,0,0,0,
      0,0,0,0,1,0,0,
      0,0,0,0,0,1,0,
      1,1,1,1,1,1,1,
      0,0,0,0,0,1,0,
      0,0,0,0,1,0,0,
      0,0,0,1,0,0,0,
    ],
  },
};

/**
 * The lit cells of an icon, as grid coordinates. Unlit cells are not returned
 * at all: a cell that is off is simply not there, as the widget cards have
 * drawn it since v1.6.0. An icon quotes the panel rather than imitating it.
 */
export function litCells(name: IconName): { x: number; y: number }[] {
  const { bits } = ICONS[name];
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (!bits[i]) continue;
    cells.push({ x: i % ICON_GRID, y: Math.floor(i / ICON_GRID) });
  }
  return cells;
}
