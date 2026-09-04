// components/clock-face.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClockFace } from "@/components/clock-face";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

/** The face at a given wall-clock instant, hands and all. */
const faceAt = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  act(() => root.render(<ClockFace />));
  return host;
};

/**
 * A hand, described the way the eye reads one: how far it reaches from the hub,
 * how wide it is drawn, and how much ink it carries.
 *
 * Read off the rendered element rather than off the source, because the defect
 * being guarded here was a hierarchy — a relationship between three drawn
 * things — and a relationship cannot be asserted from any one of them.
 */
const hands = () => {
  const lines = [...host.querySelectorAll("line")];
  return lines.map((line) => ({
    reach: 50 - Number(line.getAttribute("y2")),
    width: Number(line.getAttribute("strokeWidth") ?? line.getAttribute("stroke-width")),
    ink: Number(line.getAttribute("opacity") ?? 1),
    angle: line.getAttribute("transform") ?? "",
  }));
};

describe("ClockFace", () => {
  it("carries three hands, and the shortest of them is the hour", () => {
    act(() => root.render(<ClockFace />));
    // `everySecond` ticks once on mount, so a mounted face always has hands.
    const drawn = hands();
    expect(drawn).toHaveLength(3);
    // Document order is paint order in SVG, and the order is the hierarchy:
    // hour first and shortest, minute over it, seconds over both.
    expect(drawn[0].reach).toBeLessThan(drawn[1].reach);
    expect(drawn[1].reach).toBeLessThan(drawn[2].reach);
  });

  /**
   * The hierarchy, and the reason this file exists.
   *
   * The defect: the hour hand was drawn at full ink and half again the minute
   * hand's width, and reached most of the way to the minute hand's tip. Hands
   * coincide for a couple of minutes every hour and five seconds, and at those
   * times the minute hand was inside the hour hand — narrower and dimmer than
   * the thing occluding it — so the face read as a lozenge on a needle. Six of
   * twelve sampled times rendered that way.
   */
  it("never lets the minute hand hide inside the hour hand", () => {
    faceAt("2026-09-04T07:43:44.000Z"); // 08:43:44 in Lagos: the hands meet
    const [hour, minute] = hands();

    // Length, first: the minute hand stands proud of the hour hand's tip by
    // more than the hour hand's own length, so there is no angle at which the
    // pair can be mistaken for one mark.
    expect(minute.reach - hour.reach).toBeGreaterThan(hour.reach);

    // And value, because length alone leaves the overlapped part invisible:
    // the minute hand is the brighter of the two and is drawn after it, so it
    // is legible along its whole length rather than only past the tip.
    expect(minute.ink).toBeGreaterThan(hour.ink);

    // Width is still the hour hand's, and is still the weakest of the three
    // signals — it is the one an overlap destroys.
    expect(hour.width).toBeGreaterThan(minute.width);
  });

  it("keeps the second hand the thinnest mark and the longest", () => {
    faceAt("2026-09-04T07:43:44.000Z");
    const [hour, minute, second] = hands();
    expect(second.width).toBeLessThan(minute.width);
    expect(second.width).toBeLessThan(hour.width);
    expect(second.reach).toBeGreaterThan(minute.reach);
  });

  /**
   * The other half of the same defect: when the hands merge there has to be
   * something left on the face to read them against. There was one dot, at
   * roughly ten o'clock, indexing nothing.
   */
  it("indexes all twelve hours", () => {
    act(() => root.render(<ClockFace />));
    const marks = [...host.querySelectorAll("circle")].filter(
      (circle) => circle.getAttribute("cx") !== "50" || circle.getAttribute("cy") !== "50",
    );
    expect(marks).toHaveLength(12);

    // One of them is the twelve, and it is the loudest — otherwise the ring is
    // four-fold symmetric and says nothing about which way is up.
    const twelve = marks.find(
      (mark) => Math.abs(Number(mark.getAttribute("cx")) - 50) < 0.001,
    )!;
    expect(Number(twelve.getAttribute("cy"))).toBeLessThan(50);
    const loudest = Math.max(...marks.map((m) => Number(m.getAttribute("opacity"))));
    expect(Number(twelve.getAttribute("opacity"))).toBe(loudest);
  });

  /**
   * The marks are the one thing on this face the server draws, and `Math.sin`
   * is the one thing here two engines are allowed to disagree about. Node put
   * the eight o'clock mark at 12.760907637269142 and Chrome at
   * ...49, React wrote the first into the HTML and read the second back, and
   * the page reported a hydration mismatch it would not patch up.
   *
   * Asserting the rounding rather than the twelve literal coordinates: the
   * defect is that a coordinate carries more precision than any two engines
   * agree on, so what has to hold is the precision, not the position — which
   * the two tests either side of this one already own.
   */
  it("draws the marks at coordinates both engines can agree on", () => {
    act(() => root.render(<ClockFace />));
    const marks = [...host.querySelectorAll("circle")].filter(
      (circle) => circle.getAttribute("cx") !== "50" || circle.getAttribute("cy") !== "50",
    );
    expect(marks).toHaveLength(12);
    for (const mark of marks) {
      for (const axis of ["cx", "cy"] as const) {
        const drawn = mark.getAttribute(axis)!;
        expect(drawn).toBe(String(Math.round(Number(drawn) * 1000) / 1000));
        expect(drawn).toMatch(/^-?\d+(\.\d{1,3})?$/);
      }
    }
  });

  it("holds the marks clear of the hands and of the edge", () => {
    faceAt("2026-09-04T07:43:44.000Z");
    const longest = Math.max(...hands().map((hand) => hand.reach));
    const marks = [...host.querySelectorAll("circle")].filter(
      (circle) => circle.getAttribute("cx") !== "50" || circle.getAttribute("cy") !== "50",
    );
    for (const mark of marks) {
      const dx = Number(mark.getAttribute("cx")) - 50;
      const dy = Number(mark.getAttribute("cy")) - 50;
      const radius = Math.hypot(dx, dy);
      const r = Number(mark.getAttribute("r"));
      expect(radius - r).toBeGreaterThan(longest);
      expect(radius + r).toBeLessThan(50);
    }
  });
});
