// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExperienceTimeline } from "@/components/experience-timeline";
import type { Role } from "@/data/experience";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const role = (company: string, period: string, extra: Partial<Role> = {}): Role => ({
  role: "Product Designer",
  company,
  url: `https://${company.toLowerCase()}.example`,
  period,
  location: "Remote",
  ...extra,
});

const THREE = [
  role("Endgame", "Apr 2026 — Aug 2026"),
  role("ChessEver", "Apr 2025 — Apr 2026"),
  role("HEX", "Mar 2025 — Apr 2026"),
];

/* One observer per test, recorded so a test can decide when the section is
   seen and can prove it is never asked twice. */
let observers: { callback: IntersectionObserverCallback; disconnected: boolean }[] = [];

class FakeObserver {
  private record: { callback: IntersectionObserverCallback; disconnected: boolean };
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, disconnected: false };
    observers.push(this.record);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

const scrollIntoView = () =>
  act(() => {
    for (const observer of observers) {
      if (observer.disconnected) continue;
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        null as unknown as IntersectionObserver,
      );
    }
  });

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const render = (ui: React.ReactElement) => act(() => root.render(ui));
/* The container carries --tl-rows and --tl-cols; a track carries --tl-lane. */
const tracks = () => [...host.querySelectorAll<HTMLElement>("[style*='--tl-lane']")];

describe("the experience timeline", () => {
  it("reads earliest first whatever order the record is kept in", () => {
    render(<ExperienceTimeline roles={THREE} />);
    expect(tracks().map((t) => t.querySelector("a")?.getAttribute("href"))).toEqual([
      "https://hex.example",
      "https://chessever.example",
      "https://endgame.example",
    ]);
  });

  it("puts concurrent roles on their own tracks and returns the third to the first", () => {
    render(<ExperienceTimeline roles={THREE} />);
    expect(tracks().map((t) => t.style.getPropertyValue("--tl-col"))).toEqual(["1", "2", "1"]);
    expect(host.firstElementChild!.getAttribute("style")).toContain("repeat(2,");
  });

  it("takes a role that overlaps both without a redesign", () => {
    /* The test the brief set: more history arrives and the same component
       places it. A third concurrent role is a third track, not a rewrite. */
    render(<ExperienceTimeline roles={[...THREE, role("Fourth", "Jun 2025 — Feb 2026")]} />);
    expect(host.firstElementChild!.getAttribute("style")).toContain("repeat(3,");
    expect(tracks()).toHaveLength(4);
  });

  it("links every role out to the company, safely", () => {
    render(<ExperienceTimeline roles={THREE} />);
    for (const link of host.querySelectorAll("a")) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("says in words what the wide arrangement says in columns", () => {
    render(<ExperienceTimeline roles={THREE} />);
    const concurrent = [...host.querySelectorAll("p")].filter(
      (p) => p.textContent === "Concurrent",
    );
    // HEX and ChessEver ran together; Endgame did not.
    expect(concurrent).toHaveLength(2);
    for (const note of concurrent) expect(note.className).toContain("sm:hidden");
  });

  it("caps a track only where nothing later takes it", () => {
    render(<ExperienceTimeline roles={THREE} />);
    const capped = tracks().map((t) => t.querySelectorAll("span.rounded-full").length);
    // A start dot each; a terminal ring on the two tracks that stop.
    expect(capped).toEqual([1, 2, 2]);
  });

  it("holds the line back until the section is seen, then draws it once", () => {
    render(<ExperienceTimeline roles={THREE} />);
    expect(host.firstElementChild!.hasAttribute("data-drawn")).toBe(false);

    scrollIntoView();
    expect(host.firstElementChild!.hasAttribute("data-drawn")).toBe(true);
    expect(observers.every((o) => o.disconnected)).toBe(true);

    // Scrolling past a second time has nothing left to fire: the observer is
    // gone, and an arrival that can run twice is a performance.
    scrollIntoView();
    expect(host.firstElementChild!.hasAttribute("data-drawn")).toBe(true);
  });

  it("gives every segment a length it can be drawn along without knowing its height", () => {
    render(<ExperienceTimeline roles={THREE} />);
    for (const line of host.querySelectorAll("line")) {
      expect(line.getAttribute("pathLength")).toBe("1");
      expect(line.getAttribute("stroke-dasharray")).toBe("1");
      expect(line.getAttribute("class")).toContain("tl-track");
    }
  });

  it("times the line off the dates rather than off the layout", () => {
    render(<ExperienceTimeline roles={THREE} />);
    const ms = (el: HTMLElement, name: string) =>
      Number(el.style.getPropertyValue(name).replace("ms", ""));
    const [hex, chess, endgame] = tracks();
    expect(ms(hex, "--tl-delay")).toBe(0);
    expect(ms(chess, "--tl-delay")).toBeGreaterThan(0);
    // The two that overlap are drawn together; the one that followed waits.
    expect(ms(chess, "--tl-delay")).toBeLessThan(ms(hex, "--tl-draw"));
    expect(ms(endgame, "--tl-delay")).toBe(ms(hex, "--tl-delay") + ms(hex, "--tl-draw"));
  });

  it("is simply there for a visitor who asked for less motion", () => {
    /* `useSeenOnce` reports seen immediately under reduced motion, so the line
       is complete on the first paint it can be. The journey is withheld; the
       information is not. */
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<ExperienceTimeline roles={THREE} />);
    expect(host.firstElementChild!.hasAttribute("data-drawn")).toBe(true);
    expect(observers).toHaveLength(0);
  });

  it("draws no chart at all when there are no roles", () => {
    render(<ExperienceTimeline roles={[]} />);
    expect(host.innerHTML).toBe("");
  });
});
