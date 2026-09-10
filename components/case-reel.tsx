import { Frame } from "@/components/frame";
import { Reveal } from "@/lib/reveal";
import type { CaseBlock, CaseMedia } from "@/data/work";
import type { Asset } from "@/data/assets.generated";

/**
 * The device treatment, drawn in the site's own tokens.
 *
 * A capture reads as the thing it was captured from, and a hairline plus a
 * radius is the whole of it: no title bar, no traffic lights, no notch, no
 * shadow. The site has no skeuomorphic vocabulary to borrow from, so an
 * imitation of chrome would be the only object on the page pretending to be a
 * real thing — and a drop shadow would be the only depth.
 */
const FRAME_STYLE = {
  browser: "rounded-[var(--radius-window)] border border-line p-1.5",
  /* Wider than any token: --radius-window is a window's corner, and a phone's
     is roughly twice it. The one literal radius on the surface, and it is
     literal because it is describing a physical object, not a site shape. */
  phone: "rounded-[1.75rem] border border-line p-2",
} as const;

/**
 * How wide a phone capture is allowed to get.
 *
 * A 430-wide screenshot carries its own portrait dimensions, so a slot that
 * spans the column renders it 877px across and nineteen hundred tall — a
 * hairline drawn round that is a billboard with rounded corners, not a phone.
 * The cap rides on the figure rather than on the treatment so the caption
 * keeps the same width and edge as the frame it labels.
 */
const PHONE_HOLD = "mx-auto w-full max-w-[22rem]";
const holdFor = (frame?: CaseMedia["frame"]) => (frame === "phone" ? PHONE_HOLD : undefined);

/**
 * How wide a plate is allowed to get when everything on it is a phone.
 *
 * The plate is the reel's rhythm break: generous ground around held frames, so
 * that a run of full-width captures has somewhere to breathe. That argument was
 * made for a reel of seven blocks and it does not survive a card of three. A
 * phone capture is held to 22rem however wide the page is, so a column-wide
 * plate around one of them is 1192px of ground holding 352px of picture —
 * measured on Sylvan at 1440, a block 84% empty. In a long reel that reads as
 * air; as one of three frames on a card it reads as a card that gave up.
 *
 * So a plate carrying nothing but phones is held to a phone's measure instead.
 * Two of them get roughly twice the room, because the grid inside puts them
 * side by side from `sm` up. Any other plate — a browser capture, a crop, a
 * pair of stills — is unchanged: those fill the ground they are given.
 */
const PHONE_PLATE = ["max-w-[30rem]", "max-w-[30rem]", "max-w-[52rem]"] as const;

/**
 * Wrap a frame in its device treatment, or hand it back untouched.
 *
 * Untouched is the common case on purpose. Presentation is authored per frame
 * in `data/work.ts`; framing every capture is the same flatness with more
 * decoration, so an unauthored frame renders exactly as it did before and
 * carries no `data-frame-style` for a reader — or a test — to find.
 */
function Presented({
  frame,
  children,
}: {
  frame?: CaseMedia["frame"];
  children: React.ReactNode;
}) {
  if (!frame) return <>{children}</>;
  return (
    <div data-frame-style={frame} className={`bg-surface ${FRAME_STYLE[frame]}`}>
      {children}
    </div>
  );
}

/**
 * The run of blocks that carries one piece of work.
 *
 * Blocks carry their own art where it is authored; anything without a src falls
 * through to the next unused frame from the project's asset folder, so dropping
 * files into public/work/<slug> fills the reel in order without editing data.
 */
export function CaseReel({
  blocks,
  assets,
  preloadFirst = false,
}: {
  blocks: CaseBlock[];
  assets: Asset[];
  /**
   * Preload the first full-bleed frame. Off by default, and it has to be: a
   * reel does not know where it sits. The home is one page holding every
   * product, so `i === 0` is the top of THIS reel, not the top of the document
   * — a default of true had every piece preloading a hero, all but one held at
   * opacity 0 behind a sweep the reader may never scroll to. Only the caller
   * that knows it leads the page may turn this on.
   */
  preloadFirst?: boolean;
}) {
  // Consumed in render order — a plain counter, because the fallback is
  // positional by definition.
  let next = 0;
  const take = (media: CaseMedia) => {
    if (media.src) return { src: media.src, width: undefined, height: undefined };
    const asset = assets[next++];
    return { src: asset?.src, width: asset?.width, height: asset?.height };
  };

  return (
    <div className="space-y-[var(--pg-gap)]">
      {blocks.map((block, i) => {
        if (block.kind === "text") {
          return (
            <Reveal key={i} index={i} as="section" className="mx-auto max-w-[34rem] py-8">
              {block.heading && (
                <h2 className="font-mono text-xs uppercase tracking-wider text-ink-3">
                  {block.heading}
                </h2>
              )}
              <div className="mt-3 space-y-4">
                {block.body.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>
          );
        }

        if (block.kind === "quote") {
          return (
            <Reveal key={i} index={i} as="section" className="mx-auto max-w-[34rem] py-8">
              <p className="text-lg leading-relaxed">{block.body}</p>
              {block.attribution && (
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-3">
                  {block.attribution}
                </p>
              )}
            </Reveal>
          );
        }

        if (block.kind === "inset") {
          /* The plate carries padding so the frames inside it read as held
             rather than cropped — the rhythm break the reel needs. It is a
             third less than it was: a card shows three blocks now, and 64px of
             ground above and below one of three is a pause where there is
             nothing to pause between. */
          const phonesOnly = block.items.every((media) => media.frame === "phone");
          return (
            <Reveal key={i} index={i}>
              <div
                className={`mx-auto rounded-[var(--radius-tile)] px-6 py-8 sm:px-12 sm:py-12 ${
                  phonesOnly ? PHONE_PLATE[block.items.length] : ""
                } ${block.tone === "strong" ? "bg-strong" : "bg-surface-2"}`}
              >
                <div
                  className={`mx-auto grid max-w-[80%] gap-6 ${
                    block.items.length === 2 ? "sm:grid-cols-2" : ""
                  }`}
                >
                  {block.items.map((media, n) => {
                    const resolved = take(media);
                    return (
                      <figure key={n} className={holdFor(media.frame)}>
                        <Presented frame={media.frame}>
                          <Frame
                            src={resolved.src}
                            alt={media.alt ?? ""}
                            width={resolved.width}
                            height={resolved.height}
                            ratio={media.ratio ?? "4 / 3"}
                            sizes="(min-width: 640px) 36vw, 74vw"
                          />
                        </Presented>
                        {media.caption && (
                          <figcaption className="mt-2 font-mono text-2xs uppercase tracking-wider text-ink-3">
                            {media.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          );
        }

        if (block.kind === "pair") {
          const [a, b] = block.items;
          const left = take(a);
          const right = take(b);
          return (
            <Reveal key={i} index={i}>
              <div className="grid gap-[var(--pg-gap)] sm:grid-cols-2">
                {[
                  { media: a, resolved: left },
                  { media: b, resolved: right },
                ].map(({ media, resolved }, n) => (
                  <figure key={n} className={holdFor(media.frame)}>
                    <Presented frame={media.frame}>
                      <Frame
                        src={resolved.src}
                        alt={media.alt ?? ""}
                        width={resolved.width}
                        height={resolved.height}
                        ratio={media.ratio ?? "4 / 3"}
                        sizes="(min-width: 640px) 45vw, 92vw"
                      />
                    </Presented>
                    {media.caption && (
                      <figcaption className="mt-2 font-mono text-2xs uppercase tracking-wider text-ink-3">
                        {media.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </Reveal>
          );
        }

        const resolved = take(block);
        /* A full-bleed frame with art arrives BY the sweep, so it does not also
           get Reveal's fade. Two arrival mechanisms on one element raced each
           other: Reveal holds the block at opacity 0 until it is 8% into the
           viewport and then for up to 540ms of stagger, while the sweep's
           observer fires 220px early and the dissolve runs 620ms. The panel
           finished behind the fade, so the lattice — the whole point of the
           frame arriving this way — was never seen. One mechanism, once.

           A frame with no art has no sweep to arrive by (`Frame` only marks
           `[data-frame]` when it has a src), so it keeps the fade. */
        const swept = Boolean(resolved.src);
        /* Only a `full` block may bleed. A pair or an inset that broke the
           column would be two half-frames pushed off both edges, and the
           inset's plate is the opposite gesture — held in, not let out. */
        const bled = block.bleed === true;
        const plate = (
          <>
            <Presented frame={block.frame}>
              <Frame
                src={resolved.src}
                alt={block.alt ?? ""}
                width={resolved.width}
                height={resolved.height}
                ratio={block.ratio ?? "16 / 9"}
                preload={preloadFirst && i === 0}
                /* The full-bleed frame is the one that reads as arriving. A
                   pair or an inset plate dissolving four ways at once is a
                   performance, and nothing here moves that was not touched,
                   arriving, or reporting. */
                panel
                sizes="(min-width: 1024px) 62vw, 92vw"
              />
            </Presented>
            {block.caption && (
              /* The picture breaks the column; the words do not. A caption
                 pushed to the screen edge with the art it labels reads as a
                 layout mistake, so the bleed hands its padding back here. */
              <figcaption
                className={`mt-2 font-mono text-2xs uppercase tracking-wider text-ink-3 ${
                  bled ? "px-5 sm:px-6" : ""
                }`}
              >
                {block.caption}
              </figcaption>
            )}
          </>
        );

        /* The bleed is exactly the page's own gutter, never more. `main` is
           `px-5 sm:px-6` at every width, so these two negatives run the frame
           to the edge of the viewport and stop there. A deeper negative at
           some breakpoint would put the frame outside the document and give
           the whole page a horizontal scrollbar — the bug this branch has
           already fixed twice. */
        const figureClass = bled ? "-mx-5 sm:-mx-6" : holdFor(block.frame);

        return swept ? (
          <figure key={i} data-bleed={bled || undefined} className={figureClass}>
            {plate}
          </figure>
        ) : (
          <Reveal key={i} index={i}>
            <figure data-bleed={bled || undefined} className={figureClass}>
              {plate}
            </figure>
          </Reveal>
        );
      })}
    </div>
  );
}
