// components/glyph-polarity.test.tsx
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Which faces flip with the skin, and which ones must not.
 *
 * `GlyphCell` reads a value two ways. A luminance says how bright the depicted
 * thing is, so it has to flip with the ground — right for a photograph. Ink
 * says where the marks are, and a mark is a mark on either skin. A figure read
 * as a luminance comes out on the light skin as a hole punched in a solid
 * field: the weather disc was a black circle with a cloud-shaped gap in it,
 * and the silent music disc a black circle with the Spotify logo cut out.
 *
 * What that polarity *means* is pinned in `glyph-cell.test.tsx`, against the
 * pixels. What each face asks for is pinned here, because that is the part a
 * caller gets wrong — both defects were a missing or mis-fixed prop, not a
 * fault in the paint.
 *
 * The music disc is the interesting one: its polarity belongs to whatever the
 * field is holding, not to whether a track is playing. Artwork is a photograph
 * and wants luminance; the mark is a figure and wants ink — and the disc holds
 * the mark for a while after a track starts, until the cover has loaded.
 */

const seen: { polarity?: string }[] = [];

vi.mock("@/components/glyph-cell", () => ({
  GlyphCell: (props: { polarity?: string }) => {
    seen.push(props);
    return null;
  },
}));

const { NowPlayingDisc } = await import("@/components/now-playing-disc");
const { WeatherFace } = await import("@/components/weather-face");

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GRID = 48; // The disc's own grid; the fake cover is read back at this size.

let root: Root | null = null;
let host: HTMLElement | null = null;

/** The polarity the face is asking for right now. */
const polarity = () => seen.at(-1)?.polarity;

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
 * back a real byte array for `artFrame` to average. The bytes are a gradient
 * rather than anything meaningful — this test is about which reading is asked
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
});

describe("what each face says a value means", () => {
  it("reads the weather as ink, because a sun and a cloud are figures", async () => {
    await mount(<WeatherFace face="cloudy" />);
    expect(polarity()).toBe("ink");
  });

  it("reads the silent Spotify mark as ink", async () => {
    vi.stubGlobal("fetch", answers({ isPlaying: false }));
    await mount(<NowPlayingDisc />);
    expect(polarity()).toBe("ink");
  });

  it("still reads ink while a track plays but its cover has not arrived", async () => {
    /* The polarity follows what the field is holding, not what the route said.
       Pinned to `playing` instead, the disc would invert the mark it is still
       showing the moment a track started. */
    vi.stubGlobal("fetch", answers({ isPlaying: true, title: "A", artist: "B", artUrl: undefined }));
    await mount(<NowPlayingDisc />);
    expect(polarity()).toBe("ink");
  });

  it("turns to luminance once the artwork is in the field", async () => {
    coverLoads();
    vi.stubGlobal(
      "fetch",
      answers({ isPlaying: true, title: "A", artist: "B", artUrl: "/api/now-playing/art" }),
    );
    await mount(<NowPlayingDisc />);
    await act(async () => {
      await Promise.resolve();
    });
    // A sleeve is a photograph: its values are brightness, and must flip.
    expect(polarity()).toBe("luminance");
  });
});
