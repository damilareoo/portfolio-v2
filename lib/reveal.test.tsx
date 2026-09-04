// lib/reveal.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSeenOnce } from "@/lib/reveal";

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
  vi.unstubAllGlobals();
});

/**
 * An observer that does nothing until it is told to, so a test can hold an
 * element off screen and then put it on screen.
 *
 * jsdom lays nothing out, so a real `IntersectionObserver` — if it had one —
 * could never report an intersection anyway. What is being asserted here is
 * the hook's contract with whatever observer it is given, which is the part
 * the pedometer's walk now hangs on.
 */
function stubObserver() {
  const callbacks: IntersectionObserverCallback[] = [];
  let disconnects = 0;
  class Stub {
    constructor(callback: IntersectionObserverCallback) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {
      disconnects++;
    }
    unobserve() {}
  }
  vi.stubGlobal("IntersectionObserver", Stub);
  return {
    cross: () =>
      act(() => {
        for (const callback of callbacks) {
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            null as unknown as IntersectionObserver,
          );
        }
      }),
    get disconnects() {
      return disconnects;
    },
  };
}

let reported: boolean[] = [];
function Watched() {
  const { ref, seen } = useSeenOnce<HTMLDivElement>();
  reported.push(seen);
  return <div ref={ref} />;
}

beforeEach(() => {
  reported = [];
});

describe("useSeenOnce", () => {
  /**
   * The defect this exists for: the pedometer's walk started when its data
   * arrived, a few hundred milliseconds after mount. The wall it stands in is
   * five thousand pixels below where a visitor lands, so the walk ran and
   * finished off screen and nobody ever saw the gait.
   */
  it("says nothing has been seen until it has", () => {
    const observer = stubObserver();
    act(() => root.render(<Watched />));
    expect(reported.at(-1)).toBe(false);

    observer.cross();
    expect(reported.at(-1)).toBe(true);
  });

  it("reports once and stops watching", () => {
    const observer = stubObserver();
    act(() => root.render(<Watched />));
    observer.cross();
    expect(observer.disconnects).toBeGreaterThan(0);

    // A second crossing is a scroll back up, and an arrival that fires twice is
    // a performance. The signal goes false to true and stays there, so a caller
    // holding it in an effect's dependencies is never sent off again.
    observer.cross();
    expect(reported.at(-1)).toBe(true);
    expect(reported.slice(reported.indexOf(true))).not.toContain(false);
  });

  it("tells a page with no observer at all that it has been seen", () => {
    // Rather than never — a value withheld because a browser is old is a value
    // withheld, and Law 4's arrival clause is about motion, not about content.
    // jsdom has no `IntersectionObserver`, so this is the case unstubbed.
    expect("IntersectionObserver" in window).toBe(false);
    act(() => root.render(<Watched />));
    expect(reported.at(-1)).toBe(true);
  });

  it("tells a visitor who asked for less motion straight away", () => {
    stubObserver();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    act(() => root.render(<Watched />));
    expect(reported.at(-1)).toBe(true);
  });
});
