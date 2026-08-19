import { describe, expect, it } from "vitest";
import { GRID, decodeGlyph, encodeGlyph, glyphFrame, markGlyph } from "./forge";

const CELLS = GRID * GRID;

function drawing(lit: number[]): Uint8Array {
  const cells = new Uint8Array(CELLS);
  for (const i of lit) cells[i] = 1;
  return cells;
}

describe("encodeGlyph / decodeGlyph", () => {
  it("round-trips a drawing", () => {
    const cells = drawing([0, 13, 312, CELLS - 1]);
    const back = decodeGlyph(encodeGlyph(cells));
    expect(back).not.toBeNull();
    expect(Array.from(back!)).toEqual(Array.from(cells));
  });

  it("writes one character per cell, and only ones and zeroes", () => {
    const encoded = encodeGlyph(drawing([5]));
    expect(encoded).toHaveLength(CELLS);
    expect(encoded).toMatch(/^[01]+$/);
  });

  it("refuses a string of the wrong length", () => {
    expect(decodeGlyph("0".repeat(CELLS - 1))).toBeNull();
    expect(decodeGlyph("0".repeat(CELLS + 1))).toBeNull();
    expect(decodeGlyph("")).toBeNull();
  });

  it("refuses anything that is not a drawing", () => {
    expect(decodeGlyph("x".repeat(CELLS))).toBeNull();
    expect(decodeGlyph(`2${"0".repeat(CELLS - 1)}`)).toBeNull();
    // A JSON blob left by some other version of the site is not a drawing.
    expect(decodeGlyph('{"cells":[]}')).toBeNull();
  });

  it("treats any lit value as lit, so a hand-written file still reads", () => {
    const cells = new Uint8Array(CELLS);
    cells[7] = 9;
    expect(decodeGlyph(encodeGlyph(cells))![7]).toBe(1);
  });
});

describe("glyphFrame", () => {
  it("turns a drawing into a field of ink", () => {
    const frame = glyphFrame(drawing([0, 4]));
    expect(frame).toBeInstanceOf(Float32Array);
    expect(frame).toHaveLength(CELLS);
    expect(frame[0]).toBe(1);
    expect(frame[4]).toBe(1);
    expect(frame[1]).toBe(0);
  });

  it("gives an empty drawing an empty field, not a full one", () => {
    const frame = glyphFrame(new Uint8Array(CELLS));
    for (const value of frame) expect(value).toBe(0);
  });
});

describe("markGlyph", () => {
  const authored = drawing([1, 2, 3]);

  it("carries the visitor's drawing when they have one", () => {
    const mine = drawing([99]);
    expect(markGlyph(mine, authored)).toBe(mine);
  });

  it("falls back to the mark when nothing is stored", () => {
    expect(markGlyph(null, authored)).toBe(authored);
  });

  it("falls back to the mark when the stored drawing is empty", () => {
    // Clearing the forge is not the same as choosing a blank fourth page.
    expect(markGlyph(new Uint8Array(CELLS), authored)).toBe(authored);
  });
});
