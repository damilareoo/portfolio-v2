// components/now-playing-disc.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NowPlayingDisc } from "@/components/now-playing-disc";

/**
 * The client half of the honesty rule, one server answer at a time.
 *
 * The route's job is to stop dressing a failure as silence; this file's job is
 * to prove the card in front of the visitor draws the distinction the route
 * now makes — the em dash for an instrument that could not read, the word
 * "Silent" for one that read and found nothing, and the title otherwise.
 */

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

/** Mounts the disc against one canned response and returns what the card says. */
const readingFrom = async (response: unknown) => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));
  await act(async () => {
    root.render(<NowPlayingDisc />);
  });
  return host.textContent ?? "";
};

const answers = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

describe("NowPlayingDisc", () => {
  it("says Silent when the route reports silence", async () => {
    const text = await readingFrom(answers({ isPlaying: false }));
    expect(text).toContain("Silent");
    expect(text).not.toContain("—");
  });

  it("says the title when something is playing", async () => {
    const text = await readingFrom(
      answers({ isPlaying: true, title: "Bloom", artist: "Radiohead" }),
    );
    expect(text).toContain("Bloom");
    expect(text).not.toContain("—");
  });

  it("dashes when the route admits it could not read", async () => {
    // `{ configured: false }` has no `isPlaying`, and an unchecked body would
    // have read that absence as false and printed "Silent" over an outage.
    const text = await readingFrom(answers({ configured: false }));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });

  it("dashes on an error status, whatever the body says", async () => {
    const text = await readingFrom(answers({ error: "boom" }, 500));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });

  it("dashes on a body that is not a reading at all", async () => {
    const text = await readingFrom(answers("upstream unavailable"));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });

  it("dashes on a body whose isPlaying is not a boolean", async () => {
    const text = await readingFrom(answers({ isPlaying: "no" }));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });

  it("dashes when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("refused"))));
    await act(async () => {
      root.render(<NowPlayingDisc />);
    });
    expect(host.textContent).toContain("—");
    expect(host.textContent).not.toContain("Silent");
  });

  it("dashes when something is playing that Spotify will not name", async () => {
    // Playing, unnamed: the instrument heard sound and has no reading to give.
    const text = await readingFrom(answers({ isPlaying: true }));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });
});
