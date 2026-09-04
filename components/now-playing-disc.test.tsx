// components/now-playing-disc.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GRID, NowPlayingDisc, SIZE } from "@/components/now-playing-disc";
import { fieldReach } from "@/lib/glyph/matrix";

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

  /**
   * The ring's geometry, read back off the rendered DOM.
   *
   * Both numbers are percentages, and they are nested: the arc's box is a share
   * of the disc, and the disc is a share of the face. So the ring's radius as a
   * share of the *disc's own* radius is `r/100` of the box, times the box's
   * share of the disc, times two — the two being the step from a width to a
   * radius. Read this way the test never has to know how the component derived
   * either percentage, which is the whole point: it measures what was drawn.
   */
  const ringGeometry = () => {
    const arc = host.querySelector("svg[aria-hidden] circle") as SVGCircleElement;
    const svg = arc.closest("svg") as SVGSVGElement;
    const disc = svg.parentElement as HTMLElement;
    const discShare = Number.parseFloat(disc.style.width) / 100;
    const boxShare = Number.parseFloat(svg.style.width) / 100;
    const r = Number(arc.getAttribute("r"));
    const stroke = Number(arc.getAttribute("stroke-width"));
    return {
      /** The ring's centre line, as a share of the disc's radius. */
      ring: (r / 100) * boxShare * 2,
      /** Its inner edge — the part that would touch a dot first. */
      inner: ((r - stroke / 2) / 100) * boxShare * 2,
      /** How much of the face the disc and its ring take together. */
      face: discShare * boxShare,
      arc,
    };
  };

  it("draws the progress ring clear of the outermost dot", async () => {
    // The defect: an arc scale and a disc width computed independently from one
    // intent, and a ring drawn through the artwork it was meant to sit outside.
    await readingFrom(answers({ isPlaying: true, title: "Bloom", artist: "Radiohead" }));
    const { ring, inner } = ringGeometry();
    const reach = fieldReach(GRID, SIZE);

    expect(reach).toBeGreaterThan(1); // the ink does pass the nominal edge
    expect(ring).toBeGreaterThan(reach);
    /* And by a gap rather than a hairline, because the field moves: a pulse
       displaces the outer cells outward by something over four percent of the
       radius. */
    expect(inner - reach).toBeGreaterThanOrEqual(0.05);
  });

  it("keeps the disc and its ring together inside the face", async () => {
    // The other half of one geometry: the face clips at its own edge, so a
    // ring that cleared the dots by growing past the face would be sliced off
    // at four points instead of drawn through the artwork.
    await readingFrom(answers({ isPlaying: true, title: "Bloom", artist: "Radiohead" }));
    expect(ringGeometry().face).toBeLessThanOrEqual(1);
  });

  it("draws no ring for a track that has not started", async () => {
    // A round cap on a dash shorter than itself is a dot at twelve o'clock and
    // nothing else — a mark on the instrument with no reading behind it.
    await readingFrom(
      answers({ isPlaying: true, title: "Bloom", artist: "Radiohead", progressMs: 0, durationMs: 240_000 }),
    );
    expect(ringGeometry().arc.style.opacity).toBe("0");
  });

  it("draws the ring once there is more arc than cap", async () => {
    await readingFrom(
      answers({
        isPlaying: true,
        title: "Bloom",
        artist: "Radiohead",
        progressMs: 120_000,
        durationMs: 240_000,
      }),
    );
    expect(ringGeometry().arc.style.opacity).toBe("1");
  });

  it("dashes when something is playing that Spotify will not name", async () => {
    // Playing, unnamed: the instrument heard sound and has no reading to give.
    const text = await readingFrom(answers({ isPlaying: true }));
    expect(text).toContain("—");
    expect(text).not.toContain("Silent");
  });
});
