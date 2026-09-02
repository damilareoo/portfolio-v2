// components/instrument-card.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InstrumentCard } from "@/components/instrument-card";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentCard", () => {
  it("prints its label and its reading", () => {
    render(<InstrumentCard label="Lagos" reading="07:42"><span /></InstrumentCard>);
    expect(host.textContent).toContain("Lagos");
    expect(host.textContent).toContain("07:42");
  });

  it("says so when it has no reading, rather than going blank", () => {
    // An instrument that cannot read admits it. A blank card reads as broken.
    render(<InstrumentCard label="Weather"><span /></InstrumentCard>);
    expect(host.textContent).toContain("Weather");
    expect(host.textContent).toContain("—");
  });

  it("treats an empty or whitespace-only reading as no reading", () => {
    // reading ?? "—" alone would let a blank string through; that is the same
    // "blank card reads as broken" failure the docblock warns about.
    render(<InstrumentCard label="Weather" reading="   "><span /></InstrumentCard>);
    expect(host.textContent).toContain("Weather—");
  });

  it("gives every card the same footprint, whatever it holds", () => {
    // The defect this guards: four widgets at four sizes with no shared
    // baseline, which is what the bank exists to replace.
    render(
      <>
        <InstrumentCard label="A" reading="1"><span /></InstrumentCard>
        <InstrumentCard label="B"><span>a much longer child</span></InstrumentCard>
      </>,
    );
    const [one, two] = [...host.querySelectorAll("[data-card]")];
    expect(one.className).toBe(two.className);
  });

  it("gives the label a fixed-height row and truncates it, so a long label cannot grow the card", () => {
    // jsdom never lays out real pixels, so offsetHeight is always 0 there and
    // cannot catch a wrap-induced height difference. Assert on the structural
    // guarantee instead: the row commits to a fixed height and the label
    // commits to single-line truncation, which together is what keeps two
    // cards the same height once real (mismatched-length) copy lands.
    render(
      <>
        <InstrumentCard label="A" reading="1"><span /></InstrumentCard>
        <InstrumentCard
          label="A label a great deal longer than any real instrument name"
          reading="1"
        >
          <span />
        </InstrumentCard>
      </>,
    );
    const [shortRow, longRow] = [...host.querySelectorAll("[data-label-row]")];
    expect(shortRow.className).toBe(longRow.className);
    expect(shortRow.className).toMatch(/\bh-5\b/);
    const [shortLabel, longLabel] = [...host.querySelectorAll("[data-label]")];
    expect(shortLabel.className).toContain("truncate");
    expect(longLabel.className).toContain("truncate");
  });

  it("keeps the face square so the grid cannot distort it", () => {
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    const face = host.querySelector("[data-face]")!;
    expect(face.className).toContain("aspect-square");
  });

  it("sizes the face from CARD_FACE itself, not only from the grid around it", () => {
    // Only the parent grid's equal cells made cards match before; a card
    // rendered outside a grid must still come out the right size.
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    const face = host.querySelector("[data-face]") as HTMLElement;
    expect(face.style.width).toBe("96px");
    expect(face.style.height).toBe("96px");
  });

  it("is a button only when it has a handler to turn it with", () => {
    // A card with one face is not a control, and a control that does nothing
    // is a lie told with a cursor. There is no separate `interactive` flag
    // that can disagree with the handler — the handler's presence is the
    // only thing that decides.
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    expect(host.querySelector("button")).toBeNull();
    render(<InstrumentCard label="A" reading="1" onPress={() => {}}><span /></InstrumentCard>);
    expect(host.querySelector("button")).not.toBeNull();
  });

  it("meets the touch-target floor when it is a control", () => {
    render(<InstrumentCard label="A" reading="1" onPress={() => {}}><span /></InstrumentCard>);
    expect(host.querySelector("button")!.className).toMatch(/min-h-\[2\.75rem\]/);
  });

  it("names what pressing it does, instead of leaving the accessible name to whatever the face renders", () => {
    render(<InstrumentCard label="Now Playing" reading="Song" onPress={() => {}}><span /></InstrumentCard>);
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toMatch(/Now Playing/);
    expect(button.getAttribute("aria-label")).toMatch(/other face/i);
  });
});
