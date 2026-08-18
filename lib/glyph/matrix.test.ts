import { describe, expect, it } from "vitest";
import { TUNING, buildCells, cellIndex, liveRipples, setTargets, settle, stepCells } from "./matrix";

const GRID = 8;
const SIZE = 80;

describe("buildCells", () => {
  it("fills every position on a square", () => {
    expect(buildCells(GRID, SIZE, "square")).toHaveLength(GRID * GRID);
  });

  it("drops corners on a circle", () => {
    const cells = buildCells(GRID, SIZE, "circle");
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBeLessThan(GRID * GRID);
  });

  it("places cells at their own index", () => {
    const cells = buildCells(GRID, SIZE, "square");
    expect(cellIndex(cells[0], GRID, SIZE)).toBe(0);
    expect(cellIndex(cells[GRID * GRID - 1], GRID, SIZE)).toBe(GRID * GRID - 1);
  });

  /* Index 0 and the last index are unmoved by transposing rows and columns, so
     the diagonal alone cannot catch a swapped mapping — and a swapped mapping
     would mirror every glyph the matrix ever draws. */
  it("indexes off the diagonal in row-major order", () => {
    const cells = buildCells(GRID, SIZE, "square");
    expect(cellIndex(cells[1], GRID, SIZE)).toBe(1);
    expect(cellIndex(cells[GRID + 2], GRID, SIZE)).toBe(GRID + 2);
    // Row 1 column 2 is not row 2 column 1.
    expect(cellIndex(cells[GRID + 2], GRID, SIZE)).not.toBe(2 * GRID + 1);
  });
});

describe("TUNING", () => {
  /* The feel is a fixed quantity across every face the matrix wears. Pinned
     here so a change to it has to be a decision, not a drift. */
  it("holds the physics the disc was built on", () => {
    expect(TUNING).toEqual({
      STIFFNESS: 400,
      DAMPING: 32,
      PUSH_RADIUS: 78,
      PUSH_STRENGTH: 30,
      RIPPLE_SPEED: 320,
      RIPPLE_WIDTH: 26,
      RIPPLE_STRENGTH: 340,
      RIPPLE_LIFE: 1.3,
      PULSE_PERIOD_MS: 2000,
    });
  });
});

describe("setTargets", () => {
  /* setTargets reads the field's geometry back off the cells, which holds only
     while a lattice is centred on its field. These pin that invariant: a wrong
     size or a transposed index puts the lit value on the wrong cell, silently. */
  it("lands a lit value on the one cell standing at its index", () => {
    const cells = buildCells(GRID, SIZE, "circle");
    const values = new Float32Array(GRID * GRID);
    // Row 3, column 0: off the diagonal, and on the rim where the cull bites.
    values[3 * GRID] = 1;
    setTargets(cells, values);

    const lit = cells.filter((cell) => cell.tv === 1);
    expect(lit).toHaveLength(1);
    // Cell centres sit at (col + 0.5) * (SIZE / GRID) — here column 0, row 3.
    expect(lit[0].x).toBeCloseTo(5, 10);
    expect(lit[0].y).toBeCloseTo(35, 10);
  });

  it("gives every cell of a square field its own value, in row-major order", () => {
    const cells = buildCells(GRID, SIZE, "square");
    const values = new Float32Array(GRID * GRID);
    for (let i = 0; i < values.length; i++) values[i] = i / 1000;
    setTargets(cells, values);

    cells.forEach((cell, i) => expect(cell.tv).toBeCloseTo(i / 1000, 6));
  });

  it("survives the cull: a culled corner's value lands on no cell at all", () => {
    const cells = buildCells(GRID, SIZE, "circle");
    const values = new Float32Array(GRID * GRID);
    values[0] = 1; // Row 0, column 0 — dropped by the circular cull.
    setTargets(cells, values);

    expect(cells.some((cell) => cell.tv === 1)).toBe(false);
  });
});

describe("stepCells", () => {
  it("reports idle when nothing is acting on it", () => {
    const cells = buildCells(GRID, SIZE, "square");
    settle(cells);
    expect(stepCells(cells, 1 / 60, 0, null, [])).toBe(false);
  });

  it("reports busy while values are still migrating", () => {
    const cells = buildCells(GRID, SIZE, "square");
    const target = new Float32Array(GRID * GRID).fill(1);
    setTargets(cells, target);
    expect(stepCells(cells, 1 / 60, 0, null, [])).toBe(true);
  });

  it("converges a migrating value onto its target", () => {
    const cells = buildCells(GRID, SIZE, "square");
    setTargets(cells, new Float32Array(GRID * GRID).fill(1));
    for (let i = 0; i < 600; i++) stepCells(cells, 1 / 60, i * 16, null, []);
    expect(cells[0].v).toBeCloseTo(1, 5);
  });

  it("pushes cells away from the pointer and settles them back", () => {
    const cells = buildCells(GRID, SIZE, "square");
    settle(cells);
    const near = cells[0];
    stepCells(cells, 1 / 60, 0, { x: near.x, y: near.y + 1 }, []);
    expect(Math.abs(near.vy)).toBeGreaterThan(0);

    for (let i = 0; i < 600; i++) stepCells(cells, 1 / 60, i * 16, null, []);
    expect(Math.abs(near.oy)).toBeLessThan(0.05);
  });
});

describe("liveRipples", () => {
  it("keeps a ripple within its life and drops it after", () => {
    const ripples = [{ x: 0, y: 0, born: 0 }];
    expect(liveRipples(ripples, 100)).toHaveLength(1);
    expect(liveRipples(ripples, TUNING.RIPPLE_LIFE * 1000 + 1)).toHaveLength(0);
  });
});
