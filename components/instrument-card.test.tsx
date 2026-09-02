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

  it("keeps the face square so the grid cannot distort it", () => {
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    const face = host.querySelector("[data-face]")!;
    expect(face.className).toContain("aspect-square");
  });

  it("is a button only when it has a second face to turn to", () => {
    // A card with one face is not a control, and a control that does nothing
    // is a lie told with a cursor.
    render(<InstrumentCard label="A" reading="1"><span /></InstrumentCard>);
    expect(host.querySelector("button")).toBeNull();
    render(<InstrumentCard label="A" reading="1" interactive><span /></InstrumentCard>);
    expect(host.querySelector("button")).not.toBeNull();
  });

  it("meets the touch-target floor when it is a control", () => {
    render(<InstrumentCard label="A" reading="1" interactive><span /></InstrumentCard>);
    expect(host.querySelector("button")!.className).toMatch(/min-h-\[2\.75rem\]/);
  });
});
