// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { runPanelSweep } from "./sweep";

describe("runPanelSweep", () => {
  /* Unstubbed here rather than at the end of the test that stubs: a failing
     assertion throws before the cleanup line and a stubbed matchMedia would
     leak into every sibling. */
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing and cleans up when the host holds no frames", () => {
    const host = document.createElement("div");
    expect(() => runPanelSweep(host)()).not.toThrow();
  });

  it("shows the photograph outright when motion is reduced", () => {
    // Reduced motion is given the value, never the journey to it.
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    const host = document.createElement("div");
    host.innerHTML = `<div data-frame><canvas></canvas><img alt=""></div>`;
    const stop = runPanelSweep(host);
    expect(host.querySelector("img")!.style.opacity).toBe("1");
    stop();
  });

  /* The lead is the difference between the shots grid and a full-bleed frame:
     a batch of small tiles shares one front and is still on screen when it
     crosses, a lone frame the height of the viewport is not. The grid's value
     is the default and must stay the default. */
  it("keeps the shots grid's lead by default, and takes a caller's instead", () => {
    const seen: (string | undefined)[] = [];
    class Spy {
      constructor(_callback: unknown, options: IntersectionObserverInit) {
        seen.push(options.rootMargin);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", Spy);
    const host = document.createElement("div");
    host.innerHTML = `<div data-frame><canvas></canvas><img alt=""></div>`;

    runPanelSweep(host)();
    runPanelSweep(host, { rootMargin: "0px" })();

    expect(seen).toEqual(["220px 0px", "0px"]);
  });
});
