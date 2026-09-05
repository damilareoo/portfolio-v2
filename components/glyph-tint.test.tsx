// components/glyph-tint.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Which faces draw in somebody else's colours, and which draw in the site's.
 *
 * `GlyphCell` fills a cell with its own ink unless it is handed a tint. A tint
 * is a quotation — an album cover, today — and it must arrive exactly when the
 * field is holding one and never a frame longer. What a tint *does* to the
 * paint is pinned in `glyph-cell.test.tsx`, against the fills. What each face
 * asks for is pinned here, because that is the part a caller gets wrong.
 *
 * This replaces the polarity test that stood here. The field used to read a
 * value two ways — as a brightness that inverted on the light skin, or as ink
 * that did not — and the whole reason was that the disc handed it a
 * photograph's luminance. Colour cells took the photograph out of the value
 * channel, the axis lost its only caller, and it went. The cases below are the
 * same cases: they ask the same question about the same transitions.
 *
 * The music disc is the interesting one: what it hands over belongs to whatever
 * the field is holding, not to whether a track is playing. The disc holds the
 * mark for a while after a track starts, until the cover has loaded, and it
 * must be drawing in the site's ink for every frame of that.
 */

const seen: { tint?: Uint8ClampedArray | null }[] = [];

vi.mock("@/components/glyph-cell", () => ({
  GlyphCell: (props: { tint?: Uint8ClampedArray | null }) => {
    seen.push(props);
    return null;
  },
}));

const { NowPlayingDisc } = await import("@/components/now-playing-disc");
const { WeatherFace } = await import("@/components/weather-face");

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GRID = 64; // The disc's own grid; the fake cover is read back at this size.

let root: Root | null = null;
let host: HTMLElement | null = null;

/** Whether the face is asking to be drawn in colours of its own right now. */
const tinted = () => Boolean(seen.at(-1)?.tint);

async function mount(element: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(element);
  });
}

const answers = (body: unknown) =>
  vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }));

/**
 * A cover that arrives.
 *
 * jsdom neither loads images nor rasterises, so both are stood in for: the
 * image reports itself loaded, and the offscreen canvas it is drawn into hands
 * back a real byte array for `artwork` to average. The bytes are a gradient
 * rather than anything meaningful — this test is about whether a tint is asked
 * for, not what the sleeve looked like.
 */
function coverLoads() {
  class LoadedImage {
    crossOrigin = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", LoadedImage);

  /* Big enough for the largest read either caller makes: `spotifyMark`
     supersamples its own grid fourfold before averaging it back down. */
  const SIDE = GRID * 4;
  const pixels = new Uint8ClampedArray(SIDE * SIDE * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const v = (i / 4) % 256;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
    pixels[i + 3] = 255;
  }
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({
        imageSmoothingEnabled: false,
        imageSmoothingQuality: "low",
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 0,
        lineCap: "butt",
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: pixels, width: SIDE, height: SIDE }),
      }) as unknown as CanvasRenderingContext2D,
  );
}

beforeEach(() => {
  seen.length = 0;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("which faces draw in colours of their own", () => {
  it("draws the weather in the site's ink, because a sun and a cloud are ours", async () => {
    await mount(<WeatherFace face="cloudy" />);
    expect(tinted()).toBe(false);
  });

  it("draws the silent Spotify mark in the site's ink", async () => {
    vi.stubGlobal("fetch", answers({ isPlaying: false }));
    await mount(<NowPlayingDisc />);
    expect(tinted()).toBe(false);
  });

  it("holds the site's ink while a track plays but its cover has not arrived", async () => {
    /* The tint follows what the field is holding, not what the route said.
       Pinned to `playing` instead, the disc would tint the mark it is still
       showing the moment a track started. */
    vi.stubGlobal("fetch", answers({ isPlaying: true, title: "A", artist: "B", artUrl: undefined }));
    await mount(<NowPlayingDisc />);
    expect(tinted()).toBe(false);
  });

  it("takes the cover's own colours once the artwork is in the field", async () => {
    coverLoads();
    vi.stubGlobal(
      "fetch",
      answers({ isPlaying: true, title: "A", artist: "B", artUrl: "/api/now-playing/art" }),
    );
    await mount(<NowPlayingDisc />);
    await act(async () => {
      await Promise.resolve();
    });
    // A sleeve belongs to whoever made it, and arrives in its own colours.
    expect(tinted()).toBe(true);
    expect(seen.at(-1)!.tint).toHaveLength(GRID * GRID * 3);
  });

  it("gives the colours back when the next track brings no cover", async () => {
    /* The transition this mechanism exists for, and the half a one-sided test
       cannot reach. Every other case here asserts "no tint", which is also the
       initial state — so gutting `setTint` entirely would leave them all green.
       Only a field that has actually held a cover and let it go proves the wire
       is connected at both ends.

       This is reachable, not contrived: a track with no artwork following one
       that had it is an ordinary pair of songs, and it is the same path
       `img.onerror` takes when a sleeve fails to load. */
    coverLoads();
    vi.useFakeTimers();

    const sleeve = { isPlaying: true, title: "A", artist: "B", artUrl: "/api/now-playing/art" };
    const bare = { isPlaying: true, title: "C", artist: "D", artUrl: undefined };
    let polled = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        const body = polled++ === 0 ? sleeve : bare;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
      }),
    );

    await mount(<NowPlayingDisc />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(tinted()).toBe(true);

    // Thirty seconds on, the next poll: playing still, but nothing to look at.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    // The field is holding the mark again, and the mark is the site's own.
    expect(tinted()).toBe(false);
  });
});
