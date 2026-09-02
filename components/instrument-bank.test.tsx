// components/instrument-bank.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstrumentBank } from "@/components/instrument-bank";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentBank", () => {
  it("shows every instrument as a card", () => {
    render(<InstrumentBank />);
    expect(host.querySelectorAll("[data-card]")).toHaveLength(4);
  });

  it("names each reading for someone who cannot see it", () => {
    render(<InstrumentBank />);
    const text = host.textContent ?? "";
    for (const label of ["Lagos", "Weather", "Playing", "Steps"]) {
      expect(text).toContain(label);
    }
  });

  it("never falls to one column, because a column of cards is a list", () => {
    render(<InstrumentBank />);
    const grid = host.querySelector("[data-bank]")!;
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-4");
    expect(grid.className).not.toMatch(/grid-cols-1\b/);
  });

  it("gives every card the same shell", () => {
    render(<InstrumentBank />);
    const faces = [...host.querySelectorAll("[data-face]")];
    expect(faces).toHaveLength(4);
    for (const face of faces) expect(face.className).toContain("aspect-square");
  });
});
