import { describe, expect, it } from "vitest";
import { ICON_GRID, ICONS, litCells, type IconName } from "./icons";

const names = Object.keys(ICONS) as IconName[];

/** Rows of the icon, top to bottom. */
const rows = (name: IconName) => {
  const { bits } = ICONS[name];
  return Array.from({ length: ICON_GRID }, (_, r) =>
    bits.slice(r * ICON_GRID, r * ICON_GRID + ICON_GRID),
  );
};

describe("the icon set", () => {
  it("draws every icon on the same square grid", () => {
    expect(ICON_GRID).toBe(7);
    for (const name of names) {
      expect(ICONS[name].bits, name).toHaveLength(ICON_GRID * ICON_GRID);
    }
  });

  it("admits only lit or unlit — an icon has no half tones", () => {
    for (const name of names) {
      for (const bit of ICONS[name].bits) expect([0, 1], name).toContain(bit);
    }
  });

  it("draws something, and never everything", () => {
    // An empty icon is a bug that renders as nothing; a full one is a square.
    for (const name of names) {
      const lit = ICONS[name].bits.filter(Boolean).length;
      expect(lit, name).toBeGreaterThan(0);
      expect(lit, name).toBeLessThan(ICON_GRID * ICON_GRID);
    }
  });

  it("mirrors exactly where it claims to — 49 bits by hand is a typo waiting", () => {
    for (const name of names) {
      const { symmetry } = ICONS[name];
      const grid = rows(name);

      if (symmetry === "both" || symmetry === "leftRight") {
        for (const row of grid) expect([...row].reverse(), name).toEqual(row);
      }
      if (symmetry === "both" || symmetry === "topBottom") {
        expect([...grid].reverse(), name).toEqual(grid);
      }
    }
  });

  it("makes the two arrows each other's reflection", () => {
    const left = rows("arrow-left");
    const right = rows("arrow-right");
    expect(left.map((row) => [...row].reverse())).toEqual(right);
  });

  it("reports lit cells as coordinates, unlit ones not at all", () => {
    const cells = litCells("arrow-left");
    expect(cells).toHaveLength(ICONS["arrow-left"].bits.filter(Boolean).length);
    // The shaft is the middle row, running the full width.
    const middle = cells.filter((cell) => cell.y === 3).map((cell) => cell.x);
    expect(middle).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("carries a chevron that points down", () => {
    // The unfold's mark. It must be mirror-symmetric or it reads as an arrow
    // leaning, and its lowest lit cell must be the centre column or it is not
    // pointing anywhere.
    const bits = ICONS["chevron-down"].bits;
    expect(ICONS["chevron-down"].symmetry).toBe("leftRight");
    const lit = litCells("chevron-down");
    const bottom = Math.max(...lit.map((cell) => cell.y));
    const onBottom = lit.filter((cell) => cell.y === bottom);
    expect(onBottom).toHaveLength(1);
    expect(onBottom[0].x).toBe((ICON_GRID - 1) / 2);
    expect(bits.filter(Boolean).length).toBeGreaterThan(4);
  });
});
