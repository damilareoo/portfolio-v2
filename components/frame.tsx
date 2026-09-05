import Image from "next/image";
import { frameRatio } from "@/lib/frame-ratio";

/**
 * Every media slot on the site goes through here.
 *
 * An empty slot is not a collapsed one. Until art lands the frame prints what
 * is missing and what shape it will be — the same honesty rule the case pages
 * follow when a write-up does not exist yet.
 *
 * `panel` opts the slot into the dot-matrix sweep: it marks the wrapper
 * `[data-frame]`, lays a canvas under the photograph, and starts the
 * photograph at zero opacity so the sweep can dissolve it in. That last part
 * is a known dependency, the same one the shots grid has carried since
 * v1.10.0 — the image is invisible until `runPanelSweep` reveals it, so it
 * must only ever be set inside a `PanelField`. Every path out of the sweep
 * that cannot paint a panel (no cells, no decoded image, a tainted canvas,
 * reduced motion) puts the opacity back to 1, and a frame with no `src` never
 * takes the mark at all — there is no <img> for the sweep to hold on to, and
 * an unmarked frame is one it never sees.
 */
export function Frame({
  src,
  alt,
  width,
  height,
  ratio,
  label,
  position,
  sizes = "(min-width: 1024px) 50vw, 92vw",
  preload = false,
  panel = false,
  className = "",
}: {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  /** CSS aspect-ratio for the slot when no intrinsic size is known. */
  ratio?: string;
  label?: string;
  /**
   * Where the picture sits inside a slot that crops it — a CSS
   * `object-position`, so "50% 34%" is centred across and above centre down.
   *
   * Every slot here is `object-cover`, which means a slot whose ratio differs
   * from the picture's is a crop, and until now every crop was taken from the
   * middle. That is right for artwork composed to its own frame and wrong for a
   * photograph of a person: a phone portrait shown as a wide band loses the top
   * of the head, which is the one part of it a reader came for. The default is
   * still the middle, so no existing frame moves.
   */
  position?: string;
  sizes?: string;
  /**
   * Put a `<link rel="preload">` for this image in the head.
   *
   * Next 16 deprecated `priority` in favour of this name because the old one
   * described a ranking the browser does not have, while the behaviour was
   * only ever the preload tag. Renaming it here keeps the honest word at the
   * call site — and the call site is the only place that can know whether this
   * frame is the LCP candidate. Exactly one frame on a page should ask.
   */
  preload?: boolean;
  /** Arrive as a dot-matrix panel. Only meaningful inside a `PanelField`. */
  panel?: boolean;
  className?: string;
}) {
  const aspect = width && height ? `${width} / ${height}` : (ratio ?? "4 / 3");
  const swept = panel && Boolean(src);
  /* The same ratio as a bare number, which is what `.frame-cap` needs to work
     out how wide this frame may be before it grows taller than the screen.
     Parsed from the string rather than taken from `width`/`height`, because a
     slot with no art yet has only the declared ratio and must be capped too —
     otherwise a frame would change size the moment its picture landed. */
  const capRatio = frameRatio(aspect);

  return (
    <div
      style={{ aspectRatio: aspect, ...(capRatio ? { "--frame-ratio": capRatio } : {}) } as React.CSSProperties}
      data-frame={swept || undefined}
      className={`relative overflow-hidden rounded-[var(--radius-tile)] border border-line bg-surface-2 transition-colors ${capRatio ? "frame-cap" : ""} ${className}`}
    >
      {swept && (
        /* Sibling of the image, not a wrapper around it: `fill` positions the
           photograph against this box, and a wrapper would take that away. */
        <canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      )}
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          preload={preload}
          /* The optimiser flattens an animated GIF to its first frame, so a
             moving mark would arrive static. Serve those untouched. */
          unoptimized={src.endsWith(".gif")}
          style={position ? { objectPosition: position } : undefined}
          className={`object-cover ${swept ? "opacity-0" : ""}`}
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="font-mono text-2xs uppercase tracking-wider text-ink-3">
            {label ?? "Awaiting art"}
          </span>
          <span className="font-mono text-2xs text-ink-3 opacity-60">
            {aspect.replace(" / ", ":")}
          </span>
        </span>
      )}
    </div>
  );
}
