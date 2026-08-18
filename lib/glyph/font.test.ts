import { describe, expect, it } from "vitest";
import { stampText, textWidth } from "./font";

// glyphs.ts does not exist yet at this step, so the frame is built inline.
const emptyFrame = (grid: number) => new Float32Array(grid * grid);

describe("micro font", () => {
  it("measures digits at 3 wide with a 1 column gap", () => {
    expect(textWidth("8")).toBe(3);
    expect(textWidth("88")).toBe(7);
  });

  it("measures the comma narrower than a digit", () => {
    expect(textWidth(",")).toBe(1);
    expect(textWidth("1,0")).toBe(3 + 1 + 1 + 1 + 3);
  });

  it("stamps a digit as lit cells inside its 3x5 box", () => {
    const grid = 8;
    const frame = emptyFrame(grid);
    stampText(frame, grid, "8", 0, 0);
    // "8" is solid across its top row.
    expect([frame[0], frame[1], frame[2]]).toEqual([1, 1, 1]);
    // Its middle row is lit at the edges and the centre.
    expect(frame[2 * grid + 1]).toBe(1);
    // Nothing outside the 3-wide box is touched.
    expect(frame[3]).toBe(0);
  });

  it("clips rather than wrapping when stamped past the right edge", () => {
    const grid = 5;
    const frame = emptyFrame(grid);
    stampText(frame, grid, "8", 3, 0);
    // Column 5 does not exist, so row 1 must not be lit from a wrap.
    expect(frame[grid + 0]).toBe(0);
  });
});
