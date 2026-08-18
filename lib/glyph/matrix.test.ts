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
