// components/instrument-pair.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstrumentPair } from "@/components/instrument-pair";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("InstrumentPair", () => {
  it("names both instruments for a reader who cannot see them", () => {
    render(<InstrumentPair size={48} />);
    const labels = [...host.querySelectorAll("[aria-label]")].map((n) =>
      n.getAttribute("aria-label"),
    );
    expect(labels.some((l) => /lagos time/i.test(l ?? ""))).toBe(true);
    expect(labels.some((l) => /lagos weather/i.test(l ?? ""))).toBe(true);
  });

  it("says it has no reading while the forecast is still in flight", () => {
    // An instrument that invents a reading is worse than one that admits it has
    // none. A pending fetch is not a temperature.
    render(<InstrumentPair size={48} />);
    expect(host.textContent).not.toMatch(/\d+°/);
  });

  it("reports the temperature once the forecast lands", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ current: { temperature_2m: 29, weather_code: 2 } }),
      })),
    );
    render(<InstrumentPair size={48} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.textContent).toMatch(/29°/);
  });

  it("admits it cannot read when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<InstrumentPair size={48} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.textContent).not.toMatch(/\d+°/);
    expect(host.textContent).toMatch(/—/);
  });
});
