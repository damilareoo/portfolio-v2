// components/glyph-bay.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pedometer } from "@/components/glyph-bay";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  /* jsdom lays nothing out and has no observer, so the walk would never be
     told it had been seen. It is stubbed as "already on screen" because every
     assertion here is about which face is showing, not about the gait. */
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        queueMicrotask(() =>
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          ),
        );
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    },
  );
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const week = (steps: (number | null)[]) =>
  steps.map((value, i) => ({ date: `2026-09-1${i + 1}`, steps: value }));

/** A payload shaped like `/api/steps`, with whatever this test wants missing. */
const serve = (body: Record<string, unknown>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })),
  );

const mount = async () => {
  await act(async () => {
    root.render(<Pedometer />);
  });
};

const card = () => host.querySelector("button[data-reading]")!;
const face = () => card().getAttribute("aria-label") ?? "";
const caption = () => host.querySelector("[data-value]")?.textContent ?? "";

const FULL = {
  goal: 10_000,
  today: 6_200,
  average7: 9_004,
  days: week([9_476, 13_578, 7_725, 4_746, 9_966, 8_530, 6_200]),
  month: week([9_476, 13_578, 7_725]),
};

describe("the pedometer's opening face", () => {
  it("opens on the walk when today has been reported", async () => {
    serve(FULL);
    await mount();
    expect(face()).toContain("page 1 of 3");
    expect(caption()).toBe("6,200");
  });

  it("opens on the record when today has not, rather than on an empty walk", async () => {
    /* The defect: the walk is drawn from today, and today does not exist until
       the phone syncs. Before that the instrument opened on its one blank face
       while holding a week and a month behind it — a dash on the wall with
       every reading it had one press away. */
    serve({ ...FULL, today: null, days: week([9_476, 13_578, 7_725, 4_746, 9_966, 8_530, null]) });
    await mount();
    expect(face()).toContain("page 2 of 3");
  });

  it("falls through to the month when the week is empty but the month is not", async () => {
    serve({
      ...FULL,
      today: null,
      average7: 0,
      days: week([null, null, null, null, null, null, null]),
      month: week([9_476, 13_578, 7_725]),
    });
    await mount();
    expect(face()).toContain("page 3 of 3");
  });

  it("opens on the walk when it knows nothing at all, and says so", async () => {
    serve({ ...FULL, today: null, average7: 0, days: week([null, null, null]), month: [] });
    await mount();
    expect(face()).toContain("page 1 of 3");
    expect(caption()).toBe("—");
  });

  it("reports the average, marked as one, when today is not in yet", async () => {
    /* A dash on this bay now means nothing reported, not nothing reported
       *today* — which at any hour before the first sync was most of the day. */
    serve({ ...FULL, today: null, days: week([9_476, 13_578, 7_725, 4_746, 9_966, 8_530, null]) });
    await mount();
    expect(caption()).toBe("~9,004");
  });

  it("hands the ring to the visitor the moment they turn it", async () => {
    /* The opening face is where the ring starts, not a face it returns to: a
       pager that snapped back to what the data preferred would take the page
       away from whoever just turned it. */
    serve({ ...FULL, today: null, days: week([9_476, 13_578, 7_725, 4_746, 9_966, 8_530, null]) });
    await mount();
    expect(face()).toContain("page 2 of 3");

    await act(async () => {
      card().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(face()).toContain("page 1 of 3");
  });
});
