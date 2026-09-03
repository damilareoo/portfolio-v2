// components/instrument-card.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InstrumentReading } from "@/components/instrument-card";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentReading", () => {
  it("shows the value, and no visible label beside it", () => {
    render(<InstrumentReading srLabel="Lagos" value="07:42"><span /></InstrumentReading>);
    expect(host.textContent).toContain("07:42");
    // The face says what it is; a word above it repeats the picture.
    const visible = host.querySelector("[data-value]")!.parentElement!;
    expect(visible.textContent).toBe("07:42");
  });

  it("still names itself for a screen reader", () => {
    // Removing a visible label must not remove the accessible one.
    render(<InstrumentReading srLabel="Lagos" value="07:42"><span /></InstrumentReading>);
    const named = host.querySelector(".sr-only");
    expect(named?.textContent).toContain("Lagos");
  });

  it("says so when it cannot read", () => {
    render(<InstrumentReading srLabel="Weather"><span /></InstrumentReading>);
    expect(host.querySelector("[data-value]")!.textContent).toBe("—");
  });

  it("treats an empty or blank value as no reading", () => {
    render(<InstrumentReading srLabel="Weather" value="   "><span /></InstrumentReading>);
    expect(host.querySelector("[data-value]")!.textContent).toBe("—");
  });

  it("lets the face fill whatever cell it is given", () => {
    // The defect this guards: four small discs stranded in wide cells.
    render(<InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>);
    const face = host.querySelector("[data-face]")!;
    expect(face.className).toContain("aspect-square");
    expect(face.className).toContain("w-full");
    expect(face.getAttribute("style") ?? "").not.toMatch(/width:\s*\d+px/);
  });

  it("is a control only when it has somewhere to turn", () => {
    render(<InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>);
    expect(host.querySelector("button")).toBeNull();
    render(<InstrumentReading srLabel="A" value="1" onPress={() => {}}><span /></InstrumentReading>);
    expect(host.querySelector("button")).not.toBeNull();
  });

  it("meets the touch floor when it is a control", () => {
    render(<InstrumentReading srLabel="A" value="1" onPress={() => {}}><span /></InstrumentReading>);
    expect(host.querySelector("button")!.className).toMatch(/min-h-\[2\.75rem\]/);
  });

  /* The four below are carried over from the card this replaces. Nothing in the
     brief retired them, and each one guards a promise the reading still makes. */

  it("gives every reading the same shell, whatever it holds", () => {
    // The defect this guards: four widgets at four sizes with no shared
    // baseline, which is what the wall exists to replace.
    render(
      <>
        <InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>
        <InstrumentReading srLabel="B"><span>a much longer child</span></InstrumentReading>
      </>,
    );
    const [one, two] = [...host.querySelectorAll("[data-reading]")];
    expect(one.className).toBe(two.className);
  });

  it("truncates the value in a fixed-height row, so a track title cannot grow the reading", () => {
    // jsdom lays out no pixels, so a wrap-induced height difference is
    // invisible to it. Assert the structural guarantee instead: the row commits
    // to a height and the value commits to one line, which together is what
    // keeps two readings the same height once a real title lands.
    render(
      <>
        <InstrumentReading srLabel="A" value="1"><span /></InstrumentReading>
        <InstrumentReading
          srLabel="B"
          value="A track title a great deal longer than any clock will ever print"
        >
          <span />
        </InstrumentReading>
      </>,
    );
    const [shortValue, longValue] = [...host.querySelectorAll("[data-value]")];
    expect(shortValue.className).toContain("truncate");
    expect(longValue.className).toContain("truncate");
    const [shortRow, longRow] = [shortValue.parentElement!, longValue.parentElement!];
    expect(shortRow.className).toBe(longRow.className);
    expect(shortRow.className).toMatch(/\bh-5\b/);
  });

  it("names what pressing it does, instead of leaving the accessible name to whatever the face renders", () => {
    render(<InstrumentReading srLabel="Music" value="Song" onPress={() => {}}><span /></InstrumentReading>);
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toMatch(/Music/);
    expect(button.getAttribute("aria-label")).toMatch(/other face/i);
  });

  it("lets a pager say which face it is on, over the derived name", () => {
    // "Turn the Steps reading over" cannot say "page 2 of 3", and that sentence
    // is the one thing a screen-reader user cannot get from the dots.
    render(
      <InstrumentReading srLabel="Steps" value="9,120" onPress={() => {}} pressLabel="Steps, page 2 of 3">
        <span />
      </InstrumentReading>,
    );
    expect(host.querySelector("button")!.getAttribute("aria-label")).toBe("Steps, page 2 of 3");
  });
});
