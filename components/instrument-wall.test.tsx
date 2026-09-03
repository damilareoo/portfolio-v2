// components/instrument-wall.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstrumentWall } from "@/components/instrument-wall";

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

const reading = (label: string) =>
  [...host.querySelectorAll("[data-reading]")].find((el) =>
    (el.textContent ?? "").includes(label),
  )!;

describe("InstrumentWall", () => {
  it("shows every reading", () => {
    render(<InstrumentWall />);
    expect(host.querySelectorAll("[data-reading]")).toHaveLength(4);
  });

  it("names each one for a screen reader, though none is labelled on screen", () => {
    render(<InstrumentWall />);
    const named = [...host.querySelectorAll(".sr-only")].map((n) => n.textContent).join(" ");
    for (const name of ["Lagos", "Weather", "Music", "Steps"]) expect(named).toContain(name);
  });

  it("never falls to one column", () => {
    render(<InstrumentWall />);
    const wall = host.querySelector("[data-wall]")!;
    expect(wall.className).toContain("grid-cols-2");
    expect(wall.className).toContain("sm:grid-cols-4");
    expect(wall.className).not.toMatch(/grid-cols-1\b/);
  });

  it("divides readings with a rule rather than boxing each one", () => {
    // The chaos this replaces: four bordered cards floating under a rule.
    render(<InstrumentWall />);
    const wall = host.querySelector("[data-wall]")!;
    expect(wall.className).toMatch(/divide-x|border/);
  });

  it("tells the time rather than a dash, because the clock can always read", () => {
    // The dash means "this instrument cannot read". A clock whose hands are
    // ticking beside one is the reading contradicting its own face.
    render(<InstrumentWall />);
    const lagos = reading("Lagos");
    expect(lagos.textContent).toMatch(/\d{2}:\d{2}/);
    expect(lagos.textContent).not.toContain("—");
  });

  it("steps the pedometer both ways on the arrow keys", () => {
    // The dots are indicators, not controls, so the arrows are the only way to
    // page without a pointer — and a pager that only goes forward makes you
    // walk the whole ring to get back one face.
    render(<InstrumentWall />);
    const steps = host.querySelector("button[data-reading]")!;
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
      root.render(<InstrumentWall />);
    });
    const music = reading("Music");
    expect(music.textContent).toContain("Silent");
    expect(music.textContent).not.toContain("—");
  });

  it("keeps the dash for the read it could not take", async () => {
    // And the other half of the distinction: a refused request is ignorance,
    // and must not be dressed up as silence.
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("refused"))));
    await act(async () => {
      root.render(<InstrumentWall />);
    });
    const music = reading("Music");
    expect(music.textContent).toContain("—");
    expect(music.textContent).not.toContain("Silent");
  });

  it("does not offer a day of the month as a control it cannot size honestly", async () => {
    // A 7x6 calendar of 44px targets does not fit inside the face a bay gives
    // it, so the month face is a display: dots that say met, missed, quiet and
    // ahead, and nothing on it that takes a pointer. The month has to be
    // populated for this to mean anything — an empty calendar draws no days.
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
      root.render(<InstrumentWall />);
    });

    const steps = host.querySelector("button[data-reading]")!;
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

  it("gives every reading the same shell", () => {
    render(<InstrumentWall />);
    const faces = [...host.querySelectorAll("[data-face]")];
    expect(faces).toHaveLength(4);
    for (const face of faces) expect(face.className).toContain("aspect-square");
  });
});
