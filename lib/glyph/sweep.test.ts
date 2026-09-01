// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { runPanelSweep } from "./sweep";

describe("runPanelSweep", () => {
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
    vi.unstubAllGlobals();
  });
});
