import { Frame } from "@/components/frame";
import { Reveal } from "@/lib/reveal";
import type { CaseBlock, CaseMedia } from "@/data/work";
import type { Asset } from "@/data/assets.generated";

/**
 * The centre column of a case page.
 *
 * Blocks carry their own art where it is authored; anything without a src falls
 * through to the next unused frame from the project's asset folder, so dropping
 * files into public/work/<slug> fills the reel in order without editing data.
 */
export function CaseReel({
  blocks,
  assets,
  firstIsPriority = true,
}: {
  blocks: CaseBlock[];
  assets: Asset[];
  /** The tail of a split reel is below the fold by definition and declines it. */
  firstIsPriority?: boolean;
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
                <h2 className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
                  {block.heading}
                </h2>
              )}
              <div className="mt-3 space-y-4">
                {block.body.map((paragraph) => (
                  <p key={paragraph} className="text-[0.9375rem] leading-relaxed">
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
              <p className="text-[1.125rem] leading-relaxed">{block.body}</p>
              {block.attribution && (
                <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
                  {block.attribution}
                </p>
              )}
            </Reveal>
          );
        }

        if (block.kind === "inset") {
          /* The plate carries generous padding so the frames inside it read as
             held rather than cropped — the rhythm break the reel needs. */
          return (
            <Reveal key={i} index={i}>
              <div
                className={`rounded-[var(--radius-tile)] px-6 py-10 sm:px-12 sm:py-16 ${
                  block.tone === "strong" ? "bg-strong" : "bg-surface-2"
                }`}
              >
                <div
                  className={`mx-auto grid max-w-[80%] gap-6 ${
                    block.items.length === 2 ? "sm:grid-cols-2" : ""
                  }`}
                >
                  {block.items.map((media, n) => {
                    const resolved = take(media);
                    return (
                      <figure key={n}>
                        <Frame
                          src={resolved.src}
                          alt={media.alt ?? ""}
                          width={resolved.width}
                          height={resolved.height}
                          ratio={media.ratio ?? "4 / 3"}
                          sizes="(min-width: 640px) 36vw, 74vw"
                        />
                        {media.caption && (
                          <figcaption className="mt-2 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
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
                  <figure key={n}>
                    <Frame
                      src={resolved.src}
                      alt={media.alt ?? ""}
                      width={resolved.width}
                      height={resolved.height}
                      ratio={media.ratio ?? "4 / 3"}
                      sizes="(min-width: 640px) 45vw, 92vw"
                    />
                    {media.caption && (
                      <figcaption className="mt-2 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
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
        return (
          <Reveal key={i} index={i}>
            <figure>
              <Frame
                src={resolved.src}
                alt={block.alt ?? ""}
                width={resolved.width}
                height={resolved.height}
                ratio={block.ratio ?? "16 / 9"}
                priority={firstIsPriority && i === 0}
                /* The full-bleed frame is the one that reads as arriving. A
                   pair or an inset plate dissolving four ways at once is a
                   performance, and nothing here moves that was not touched,
                   arriving, or reporting. */
                panel
                sizes="(min-width: 1024px) 62vw, 92vw"
              />
              {block.caption && (
                <figcaption className="mt-2 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          </Reveal>
        );
      })}
    </div>
  );
}
