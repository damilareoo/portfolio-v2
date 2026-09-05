import { describe, expect, it } from "vitest";
import { groupDigits, numberFrame, walkCells, walkFrame } from "./steps-frames";

const GRID = 25;

describe("groupDigits", () => {
  it("groups thousands with a comma", () => {
    expect(groupDigits(5391)).toBe("5,391");
    expect(groupDigits(987)).toBe("987");
    expect(groupDigits(0)).toBe("0");
    expect(groupDigits(1234567)).toBe("1,234,567");
  });
});

describe("numberFrame", () => {
  it("lights cells for a value", () => {
    const frame = numberFrame(GRID, 5391);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("centres the number horizontally", () => {
    const frame = numberFrame(GRID, 8);
    const lit: number[] = [];
    for (let i = 0; i < frame.length; i++) if (frame[i] > 0) lit.push(i % GRID);
    const left = Math.min(...lit);
    const right = Math.max(...lit);
    expect(Math.abs(left - (GRID - 1 - right))).toBeLessThanOrEqual(1);
  });
});

describe("walkFrame", () => {
  it("puts the walker at the left edge at zero progress", () => {
    const frame = walkFrame(GRID, 0);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  it("moves the walker rightward as progress grows", () => {
    const centroid = (progress: number) => {
      const frame = walkFrame(GRID, progress);
      let sum = 0;
      let weight = 0;
      for (let i = 0; i < frame.length; i++) {
        sum += (i % GRID) * frame[i];
        weight += frame[i];
      }
      return sum / weight;
    };
    expect(centroid(1)).toBeGreaterThan(centroid(0.5));
    expect(centroid(0.5)).toBeGreaterThan(centroid(0));
  });

  it("clamps beyond the goal rather than walking off the grid", () => {
    const frame = walkFrame(GRID, 3);
    for (let i = 0; i < frame.length; i++) expect(frame[i]).toBeLessThanOrEqual(1);
    expect(frame.some((v) => v > 0)).toBe(true);
  });

  /**
   * The gait.
   *
   * The defect: a figure translated along a static track and nothing else, so
   * it read as a decal on a wire rather than as something walking. These say
   * the form changes with the ground covered, that it changes only with the
   * ground covered, and that the change is a cycle rather than a drift.
   */
  const PATH_ROW = Math.round((GRID - 1) / 2);

  /** Where a given cell along the path puts the walker. */
  const at = (left: number) => left / (GRID - 6);

  /** The figure alone — the path row dropped, and the shape moved back to its
      own left edge, so two positions can be compared as forms rather than as
      places.

      `bound` is where the walk is headed. Passed, the figure is mid-journey and
      steps; omitted, it has arrived and stands. Every assertion about the gait
      is a mid-journey one, so these pass a bound of the far end of the path. */
  const formAt = (progress: number, bound = 1): string => {
    const frame = walkFrame(GRID, progress, { bound });
    const lit: [number, number][] = [];
    for (let row = 0; row < PATH_ROW; row++) {
      for (let col = 0; col < GRID; col++) {
        if (frame[row * GRID + col] > 0) lit.push([row, col]);
      }
    }
    const leftMost = Math.min(...lit.map(([, col]) => col));
    return lit.map(([row, col]) => `${row},${col - leftMost}`).join(" ");
  };

  it("changes the figure's form as it travels", () => {
    expect(formAt(at(0))).not.toBe(formAt(at(2)));
    expect(formAt(at(2))).not.toBe(formAt(at(4)));
  });

  it("takes three forms and repeats them, rather than drifting", () => {
    const forms = new Set<string>();
    for (let left = 0; left < GRID - 6; left++) forms.add(formAt(at(left)));
    // Passing, and the two contacts it falls between. The passing pose is one
    // shape at both ends of a stride: a silhouette this small cannot say which
    // leg is passing which.
    expect(forms.size).toBe(3);
  });

  it("comes back to the same form one stride later", () => {
    for (const left of [0, 1, 2, 3]) expect(formAt(at(left))).toBe(formAt(at(left + 8)));
  });

  it("holds one form while nothing is moving", () => {
    // A page at rest is a still page. The pose is a function of distance and of
    // nothing else, so the same distance is the same figure, forever.
    expect(walkFrame(GRID, 0.4)).toEqual(walkFrame(GRID, 0.4));
    expect(formAt(0.4)).toBe(formAt(0.4 + 1e-9));
  });

  it("keeps the walker's feet on the path in every form", () => {
    for (let left = 0; left < GRID - 6; left++) {
      const frame = walkFrame(GRID, at(left), { bound: 1 });
      const feet = Array.from({ length: GRID }, (_, col) => frame[(PATH_ROW - 1) * GRID + col]);
      expect(feet.some((value) => value > 0)).toBe(true);
    }
  });

  /**
   * The still state, which is the one anybody looks at.
   *
   * The defect: a settled walk stood up only for a day that met its goal in
   * full. Every other day held whichever phase the last cell landed on, and the
   * phase flips every two cells — so about half of all days sat on a contact
   * pose, arms out and legs splayed, for as long as the page was open.
   */
  it("stands the walker up wherever a finished walk stopped", () => {
    const standing = formAt(0, 0);
    for (let left = 0; left <= GRID - 6; left++) {
      // No bound: the walk is over. Whatever cell it ended on, the figure is up.
      expect(formAt(at(left), at(left))).toBe(standing);
      expect(walkFrame(GRID, at(left))).toEqual(walkFrame(GRID, at(left), { bound: at(left) }));
    }
  });

  it("stands the walker up at either end of the path", () => {
    // Nothing walked and the whole goal walked are both a figure standing: one
    // has not set off, the other has arrived, and neither is mid-stride.
    expect(formAt(1, 1)).toBe(formAt(0, 0));
  });

});

describe("walkCells", () => {
  /* The walk's duration is counted in these, so the caller can pace an arrival
     without knowing how wide the figure is. */
  it("counts the cells the figure travels", () => {
    expect(walkCells(GRID, 0)).toBe(0);
    expect(walkCells(GRID, 1)).toBe(GRID - 6);
    expect(walkCells(GRID, 0.5)).toBe(Math.round((GRID - 6) / 2));
  });

  it("clamps rather than walking off the grid", () => {
    expect(walkCells(GRID, 3)).toBe(GRID - 6);
    expect(walkCells(GRID, -1)).toBe(0);
  });
});
