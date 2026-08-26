import { describe, expect, it } from "vitest";
import {
  CEIL,
  FLOOR,
  PITCH,
  STEPS,
  cellsAcross,
  emitter,
  paintPanel,
  panelFrom,
  quantise,
  smoothstep,
} from "./panel";

/** A row of pixels at one luminance, as ImageData would hand them over. */
const flat = (n: number, level: number) => {
  const px = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = level;
    px[i * 4 + 3] = 255;
  }
  return px;
};

describe("the panel", () => {
  it("keeps one pitch, so a small shot and a large one share a field", () => {
    expect(cellsAcross(PITCH * 10)).toBe(10);
    expect(cellsAcross(PITCH * 40)).toBe(40);
  });

  it("never asks for fewer than two cells, however small the box", () => {
    expect(cellsAcross(1)).toBe(2);
    expect(cellsAcross(0)).toBe(2);
  });

  it("lights an emitter for a dark pixel, not a bright one", () => {
    const dark = panelFrom(flat(4, 0), 2, 2);
    const bright = panelFrom(flat(4, 255), 2, 2);
    // A flat frame has no range to stretch, so autoLevel leaves it alone.
    expect(dark.values[0]).toBeGreaterThan(bright.values[0]);
  });

  it("drives in steps, because a panel has no continuous dimmer", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 100; i++) seen.add(quantise(i / 100));
    expect(seen.size).toBe(STEPS);
  });

  it("holds every emitter at the floor before the front arrives", () => {
    // The lattice is the panel's face: on, and saying nothing yet.
    expect(emitter(1, 0)).toBe(quantise(FLOOR));
    expect(emitter(0, 0)).toBe(quantise(FLOOR));
  });

  it("never drives an emitter to full ink", () => {
    expect(emitter(1, 1)).toBeLessThanOrEqual(quantise(CEIL));
  });

  it("opens monotonically — a front can only ever reveal", () => {
    let last = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = emitter(1, t);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });

  it("puts no corners on either end of the wavefront", () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(2)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });
});

/**
 * A recording context, because there is no 2D canvas here and because what
 * matters is not the picture but the shape of the work: how many emitters were
 * drawn, and how many times the panel had to stop and fill.
 */
function recorder() {
  const seen = { arcs: 0, moves: 0, fills: 0, alphas: [] as number[], order: [] as string[] };
  const ctx = {
    globalAlpha: 1,
    fillStyle: "",
    setTransform: () => {},
    clearRect: () => {},
    beginPath: () => {
      seen.order.push("begin");
    },
    moveTo: () => {
      seen.moves++;
      seen.order.push("move");
    },
    arc: () => {
      seen.arcs++;
      seen.order.push("arc");
    },
    fill: () => {
      seen.fills++;
      seen.alphas.push(ctx.globalAlpha);
      seen.order.push("fill");
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, seen };
}

/** A field with every value distinct, so it uses as many levels as it can. */
const ramp = (cols: number, rows: number) => {
  const values = new Float32Array(cols * rows);
  for (let i = 0; i < values.length; i++) values[i] = i / (values.length - 1);
  return { cols, rows, values };
};

const BOX = { width: 301, height: 217, originX: 0, originY: 0 };

describe("painting a panel", () => {
  it("draws every emitter — an unlit one is present, not absent", () => {
    const { ctx, seen } = recorder();
    const panel = ramp(43, 31);
    paintPanel(ctx, panel, BOX, -Infinity, 234, "#000");
    expect(seen.arcs).toBe(43 * 31);
  });

  it("costs one fill per brightness step, not one per emitter", () => {
    // The whole reason a page of thirty shots can share a wavefront. The arcs
    // are cheap; it is the state change and the rasterisation around each one
    // that are not, so they are paid sixteen times rather than 1,333.
    const { ctx, seen } = recorder();
    paintPanel(ctx, ramp(43, 31), BOX, 120, 234, "#000");
    expect(seen.fills).toBeLessThanOrEqual(STEPS - 1);
    expect(seen.arcs).toBeGreaterThan(seen.fills * 50);
  });

  it("does not grow its fills when the field grows", () => {
    const small = recorder();
    const large = recorder();
    paintPanel(small.ctx, ramp(20, 15), BOX, 120, 234, "#000");
    paintPanel(large.ctx, ramp(86, 62), BOX, 120, 234, "#000");
    expect(large.seen.arcs).toBeGreaterThan(small.seen.arcs * 3);
    expect(large.seen.fills).toBeLessThanOrEqual(STEPS - 1);
  });

  it("opens a subpath per emitter, so no fill joins two of them", () => {
    const { ctx, seen } = recorder();
    paintPanel(ctx, ramp(12, 8), BOX, 60, 234, "#000");
    expect(seen.moves).toBe(seen.arcs);
    // Every arc is immediately preceded by a move; a bare arc would draw a line
    // from wherever the last one ended and the fill would pick up the join.
    seen.order.forEach((op, i) => {
      if (op === "arc") expect(seen.order[i - 1]).toBe("move");
    });
  });

  it("fills only at levels the panel can drive", () => {
    const { ctx, seen } = recorder();
    paintPanel(ctx, ramp(43, 31), BOX, 120, 234, "#000");
    for (const alpha of seen.alphas) {
      expect(quantise(alpha)).toBeCloseTo(alpha, 6);
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(1);
    }
    // No level is filled twice — that would mean the buckets leaked.
    expect(new Set(seen.alphas).size).toBe(seen.alphas.length);
  });

  it("leaves no alpha behind for whatever draws next", () => {
    const { ctx, seen } = recorder();
    paintPanel(ctx, ramp(20, 15), BOX, 60, 234, "#000");
    expect(ctx.globalAlpha).toBe(1);
    expect(seen.fills).toBeGreaterThan(0);
  });

  it("keeps its buckets to itself between calls", () => {
    const first = recorder();
    const second = recorder();
    paintPanel(first.ctx, ramp(43, 31), BOX, 120, 234, "#000");
    paintPanel(second.ctx, ramp(43, 31), BOX, 120, 234, "#000");
    // Scratch buffers are reused; if they were not cleared the second call
    // would draw the first call's emitters over again.
    expect(second.seen.arcs).toBe(first.seen.arcs);
  });
});
