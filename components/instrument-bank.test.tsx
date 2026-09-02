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

const card = (label: string) =>
  [...host.querySelectorAll("[data-card]")].find((el) =>
    (el.textContent ?? "").includes(label),
  )!;

describe("InstrumentBank", () => {
  it("shows every instrument as a card", () => {
    render(<InstrumentBank />);
    expect(host.querySelectorAll("[data-card]")).toHaveLength(4);
  });

  it("names each reading for someone who cannot see it", () => {
    render(<InstrumentBank />);
    const text = host.textContent ?? "";
    for (const label of ["Lagos", "Weather", "Music", "Steps"]) {
      expect(text).toContain(label);
    }
  });

  it("never falls to one column, because a column of cards is a list", () => {
    render(<InstrumentBank />);
    const grid = host.querySelector("[data-bank]")!;
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).not.toMatch(/grid-cols-1\b/);
  });

  it("goes four-up at sm, where the cell would otherwise dwarf the face", () => {
    // Measured at 768: two columns gave 352px cells around a 96px face — wider
    // than the 286px cell the four-up gets at 1440. The four-up has to arrive
    // while the cells are still close to the face, not a viewport later.
    render(<InstrumentBank />);
    const grid = host.querySelector("[data-bank]")!;
    expect(grid.className).toContain("sm:grid-cols-4");
    expect(grid.className).not.toContain("lg:grid-cols-4");
  });

  it("tells the time rather than a dash, because the clock can always read", () => {
    // The dash means "this instrument cannot read". A clock whose hands are
    // ticking beside one is the card contradicting its own face.
    render(<InstrumentBank />);
    const lagos = card("Lagos");
    expect(lagos.textContent).toMatch(/\d{2}:\d{2}/);
    expect(lagos.textContent).not.toContain("—");
  });

  it("steps the pedometer both ways on the arrow keys", () => {
    // The dots are indicators, not controls, so the arrows are the only way to
    // page without a pointer — and a pager that only goes forward makes you
    // walk the whole ring to get back one face.
    render(<InstrumentBank />);
    const steps = host.querySelector("button[data-card]")!;
    const face = () => steps.getAttribute("aria-label") ?? "";
    const press = (key: string) =>
      act(() => {
        steps.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });

    expect(face()).toContain("page 1 of 3");
    press("ArrowRight");
    expect(face()).toContain("page 2 of 3");
    press("ArrowLeft");
    expect(face()).toContain("page 1 of 3");
    // And it wraps, rather than stopping at an end nothing announced.
    press("ArrowLeft");
    expect(face()).toContain("page 3 of 3");
  });

  it("says it is silent when Spotify reports silence, rather than dashing", async () => {
    // The dash means "this instrument cannot read". Spotify answering "nothing
    // is playing" is a reading, not a failure to take one.
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) =>
        String(url).includes("now-playing")
          ? Promise.resolve({ ok: true, json: () => Promise.resolve({ isPlaying: false }) })
          : new Promise(() => {}),
      ),
    );
    await act(async () => {
      root.render(<InstrumentBank />);
    });
    const music = card("Music");
    expect(music.textContent).toContain("Silent");
    expect(music.textContent).not.toContain("—");
  });

  it("keeps the dash for the read it could not take", async () => {
    // And the other half of the distinction: a refused request is ignorance,
    // and must not be dressed up as silence.
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("refused"))));
    await act(async () => {
      root.render(<InstrumentBank />);
    });
    const music = card("Music");
    expect(music.textContent).toContain("—");
    expect(music.textContent).not.toContain("Silent");
  });

  it("does not offer a day of the month as a control it cannot size honestly", async () => {
    // A 7x6 calendar of 44px targets does not fit inside a 96px face, so the
    // month face is a display: dots that say met, missed, quiet and ahead, and
    // nothing on it that takes a pointer. The month has to be populated for
    // this to mean anything — an empty calendar draws no days to press.
    const month = Array.from({ length: 28 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      steps: 12_000,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) =>
        String(url).includes("steps")
          ? Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  today: 12_000,
                  days: month.slice(-7),
                  month,
                  average7: 12_000,
                  updatedAt: 0,
                  goal: 10_000,
                }),
            })
          : new Promise(() => {}),
      ),
    );
    await act(async () => {
      root.render(<InstrumentBank />);
    });

    const steps = host.querySelector("button[data-card]")!;
    act(() => {
      steps.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(steps.getAttribute("aria-label")).toContain("page 3 of 3");
    // The month is drawn — otherwise the two assertions below prove nothing.
    expect(steps.querySelectorAll("svg circle").length).toBeGreaterThan(20);
    expect(steps.querySelectorAll("[class*=cursor-pointer]")).toHaveLength(0);
    expect(steps.querySelectorAll("[class*=pointer-events-auto]")).toHaveLength(0);
    // And every day of the month still reaches a screen reader, in words.
    expect(host.textContent).toContain("This month, day by day");
  });

  it("gives every card the same shell", () => {
    render(<InstrumentBank />);
    const faces = [...host.querySelectorAll("[data-face]")];
    expect(faces).toHaveLength(4);
    for (const face of faces) expect(face.className).toContain("aspect-square");
  });
});
