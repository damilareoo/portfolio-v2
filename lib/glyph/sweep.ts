import {
  BAND,
  SKEW,
  cellsAcross,
  paintPanel,
  panelFrom,
  smoothstep,
  type Panel,
  type PanelBox,
} from "@/lib/glyph/panel";

/** How long a front takes to cross. Noticed, rather than watched. */
const SWEEP = 620;

/** Tiles arriving within this window share one front instead of firing apart. */
const BATCH = 80;

/**
 * A tile carries its own box, measured once when it arrives.
 *
 * A sweep repaints every member sixty times a second, and asking the document
 * where a frame is — or what colour the ink currently is — inside that loop
 * costs a layout and a style resolution per tile per frame. The box is in page
 * coordinates and so does not move when the page scrolls, and the ink cannot
 * change mid-sweep, so both are read once and carried.
 */
type Tile = {
  frame: HTMLElement;
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;
  box: PanelBox;
};

function measure(frame: HTMLElement): PanelBox {
  const rect = frame.getBoundingClientRect();
  return {
    width: frame.clientWidth,
    height: frame.clientHeight,
    originX: rect.left + window.scrollX,
    originY: rect.top + window.scrollY,
  };
}

/**
 * How early a frame is told to arrive.
 *
 * This was the shots grid's value when the shots grid was four columns of
 * 302px tiles: a small tile that begins resolving a little before it is on
 * screen is settled by the time it is read, and a batch of them shares one
 * front that is on screen even though every member started early. No caller
 * asks for it any more — /shots is composed of full-measure and half-measure
 * frames now and passes "0px" like the rest — so it stands as the default a
 * field of small tiles would want, not as a value in use. See `rootMargin` on
 * the options for why every large frame overrides it.
 */
const LEAD = "220px 0px";

/**
 * Sweep a dot-matrix front across every `[data-frame]` inside `host`.
 *
 * Lifted out of ShotsField unchanged: the effect never knew what a shot was, it
 * only knew how to find a frame, sample it, and dissolve a photograph out of a
 * panel. Returns its own teardown, so a caller's effect is one line.
 *
 * Every frame it touches must contain a <canvas> and an <img>, and the image
 * must start at opacity 0 — the sweep is what makes it visible. That contract
 * cuts both ways, so every path out of here that cannot paint a panel — no
 * cells, no decoded image, a tainted canvas, no 2D context, reduced motion —
 * puts the photograph back at opacity 1 rather than leaving an empty slot.
 *
 * One front is shared by every tile that arrives inside `BATCH`, and a tile is
 * unobserved the moment it is queued: a frame arrives once, and a sweep that
 * fires twice for the same photograph is a performance rather than an arrival.
 */
export function runPanelSweep(
  host: HTMLElement,
  {
    /**
     * How far outside the viewport a frame starts arriving.
     *
     * The default is a field of small tiles': a batch of them shares one front
     * that crosses all of them, so the wave is on screen even though each tile
     * started early.
     *
     * A large frame has no such batch. Its front spans only its own box, so the
     * whole 620ms dissolve fits inside the 220px of lead plus the frame's own
     * height — measured on the home at a 700px/s scroll, the photograph was
     * already at full opacity when 60px of the frame had entered the viewport,
     * and the panel was never seen. Such a caller passes "0px" and the frame
     * arrives when it is actually somewhere a reader is looking. Every caller
     * on the site now does, /shots included, since its frames stopped being
     * tiles.
     */
    rootMargin = LEAD,
    /**
     * A last pass over a panel's values, before anything is painted.
     *
     * `panelFrom` already levels every frame against itself, which fixes its
     * *extent* — the picture is guaranteed to span the panel's range. It says
     * nothing about where inside that range the picture sits, and for a
     * low-key photograph those are different problems: the About portrait
     * levels correctly and still stacks a third of its emitters on one step.
     *
     * The hook is here rather than inside `panelFrom` because the panel's
     * constants are shared with every shot and case frame on the site and were
     * settled in phase 1. A caller whose photograph needs a correction asks for
     * it; every existing caller passes nothing and renders exactly what it
     * rendered before. See `centreMidtone` in lib/glyph/tone.ts.
     */
    tone,
  }: { rootMargin?: string; tone?: (values: Float32Array) => Float32Array } = {},
): () => void {
  const panels = new WeakMap<HTMLElement, Panel>();

  /* Sampling reads the decoded image back out of a canvas, which taints on a
     cross-origin source and throws. Everything here is same-origin, but a
     failure must leave the photograph visible rather than an empty panel. */
  const sample = (tile: Tile): Panel | null => {
    const { box, img } = tile;
    if (!box.width || !box.height || !img.naturalWidth) return null;
    const cols = cellsAcross(box.width);
    const rows = cellsAcross(box.height);
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const ctx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, cols, rows);
    try {
      const panel = panelFrom(ctx.getImageData(0, 0, cols, rows).data, cols, rows);
      return tone ? { ...panel, values: tone(panel.values) } : panel;
    } catch {
      return null;
    }
  };

  const paint = (tile: Tile, front: number, ink: string) => {
    const panel = panels.get(tile.frame);
    if (!panel) return;
    const { width, height } = tile.box;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (tile.canvas.width !== Math.round(width * dpr)) {
      tile.canvas.width = Math.round(width * dpr);
      tile.canvas.height = Math.round(height * dpr);
    }
    const ctx = tile.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintPanel(ctx, panel, tile.box, front, BAND * window.innerHeight, ink);
  };

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tiles: Tile[] = [...host.querySelectorAll<HTMLElement>("[data-frame]")].map((frame) => ({
    frame,
    canvas: frame.querySelector("canvas") as HTMLCanvasElement,
    img: frame.querySelector("img") as HTMLImageElement,
    /* Measured again when the tile arrives — the grid has not necessarily
       settled at the moment the effect runs, and the images have not loaded. */
    box: measure(frame),
  }));

  /* A host with nothing to sweep never builds an observer. The original had no
     reason to say so — the shots grid is never empty — but this runs against a
     collapsed entry whose frames are not in the document yet, and a teardown
     that has to exist either way is cheaper than one that had to be built. */
  if (!tiles.length) return () => {};

  /* The ink is one custom property on the root, and it cannot change while a
     front is crossing. Reading it per tile per frame resolved the document's
     whole computed style thirty times a frame to learn the same string. */
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--text-1").trim();

  /* Reduced motion is given the value, never the journey to it. */
  if (still) {
    tiles.forEach((t) => t.img.style.setProperty("opacity", "1"));
    return () => {};
  }

  let queue: Tile[] = [];
  let timer: number | undefined;
  let frames: number[] = [];

  const run = (members: Tile[]) => {
    if (!members.length) return;
    const band = BAND * window.innerHeight;
    const spans = members.map(({ box }) => [
      box.originY + box.originX * SKEW,
      box.originY + box.height + (box.originX + box.width) * SKEW,
    ]);
    const from = Math.min(...spans.map((s) => s[0])) - band;
    const to = Math.max(...spans.map((s) => s[1])) + band;
    const start = performance.now();
    const colour = ink();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP);
      const front = from + (to - from) * t;
      for (const tile of members) {
        paint(tile, front, colour);
        /* The photograph takes over while the front is still crossing, so the
           panel is never the finished picture — only the moment before it. */
        const { box } = tile;
        const mid = box.originY + box.height * 0.45 + box.originX * SKEW;
        tile.img.style.opacity = String(smoothstep((front - mid) / band + 0.3));
      }
      if (t < 1) frames.push(requestAnimationFrame(step));
      else
        members.forEach((tile) => {
          tile.img.style.opacity = "1";
          const ctx = tile.canvas.getContext("2d");
          ctx?.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
        });
    };
    frames.push(requestAnimationFrame(step));
  };

  const enqueue = (tile: Tile) => {
    tile.box = measure(tile.frame);
    const panel = sample(tile);
    if (!panel) {
      tile.img.style.opacity = "1";
      return;
    }
    panels.set(tile.frame, panel);
    paint(tile, -Infinity, ink());
    queue.push(tile);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const batch = queue;
      queue = [];
      run(batch);
    }, BATCH);
  };

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const tile = tiles.find((t) => t.frame === entry.target);
        if (!tile) return;
        io.unobserve(entry.target);
        if (tile.img.complete && tile.img.naturalWidth) enqueue(tile);
        /* A photograph that will never decode is the one case where waiting is
           worse than giving up: the image starts at opacity 0 and only this
           function ever puts it back, so a `load` that cannot fire leaves an
           empty frame on the page for good. Both halves of that are covered —
           an image that has already failed is `complete` with no intrinsic
           width and gets its opacity now, and one still in flight gets an
           `error` beside its `load`. */
        else if (tile.img.complete) tile.img.style.setProperty("opacity", "1");
        else {
          tile.img.addEventListener("load", () => enqueue(tile), { once: true });
          tile.img.addEventListener(
            "error",
            () => tile.img.style.setProperty("opacity", "1"),
            { once: true },
          );
        }
      }),
    { rootMargin, threshold: 0.01 },
  );
  tiles.forEach((t) => io.observe(t.frame));

  return () => {
    io.disconnect();
    window.clearTimeout(timer);
    frames.forEach(cancelAnimationFrame);
    frames = [];
  };
}
