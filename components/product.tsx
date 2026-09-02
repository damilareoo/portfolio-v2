"use client";

import { useId, useState } from "react";
import { CaseReel } from "@/components/case-reel";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { PanelField } from "@/components/panel-field";
import { RecordRow, SectionLabel, Tags } from "@/components/ui";
import { splitBlocks } from "@/lib/case-blocks";
import { Reveal } from "@/lib/reveal";
import type { CaseBlock, WorkItem } from "@/data/work";
import type { Asset } from "@/data/assets.generated";

/**
 * One product, numbered, on the home.
 *
 * This is `EraSection` and `EraEntry` merged. Eras contained entries, so it
 * took two components to draw one piece of work; four flat products need one.
 * The number is the era's — ordering made visible — and the head, the reel and
 * the fold are the entry's, unchanged.
 *
 * The lede stands open; everything else — the rail prose the case page used to
 * carry, and the rest of the reel — waits behind one control. It waits in the
 * DOM rather than out of it: collapsed with grid rows, not `hidden`, so the
 * whole case study is still crawlable and still found by cmd-F. That is the
 * only thing that survived retiring /work/[slug], and `hidden` would spend it.
 *
 * The open state is deliberately not persisted. Law 3 governs layout the
 * visitor sets, as the DialKit does; a reading position is not a setting, and a
 * portfolio that reopens four dossiers on arrival has forgotten what the
 * collapsed state was for.
 */
export function Product({
  item,
  assets,
  index,
}: {
  item: WorkItem;
  assets: Asset[];
  /** Position on the page. Drives the number, the arrival stagger, and the one
      preload — only the first product is above the fold on a cold load. */
  index: number;
}) {
  const [open, setOpen] = useState(false);
  /* Sticky, never a toggle. The tail's `PanelField` is keyed to this, and a
     revision that came back down on close rebuilt the sweep while the fold was
     still collapsing: the tail is at full height for most of the 500ms row
     transition, so a fresh observer fired at once and frames that had already
     arrived swept a second time, in full view through the shrinking clip. It
     goes false → true the first time the fold opens and stays there, so the
     sweep is built once and every frame arrives once. */
  const [everOpened, setEverOpened] = useState(false);
  const panelId = useId();
  const ordinal = String(index + 1).padStart(2, "0");

  /* Art with no blocks authored for it is still worth showing: fall back to one
     full frame per asset, in filename order — as the case page did. */
  const blocks: CaseBlock[] =
    item.blocks && item.blocks.length > 0
      ? item.blocks
      : assets.map<CaseBlock>((asset) => ({ kind: "full", alt: asset.title }));

  const { lede, rest, restAssetOffset } = splitBlocks(blocks);
  const prose = (item.intro?.length ?? 0) + (item.approach?.length ?? 0) > 0;
  const more = rest.length > 0 || prose;

  /* `Reveal`, not a copy of it. The `arrive` class is opacity 0 until something
     sets `data-arrived`, and a hand-rolled version of this — the class copied,
     the hook forgotten — is what once shipped every entry on the home
     permanently invisible. The contract lives in one component so it cannot be
     half-copied again. The id rides on it because a retired /work/<slug> URL
     redirects to /#<slug>, and the anchor has to be the top of the product. */
  return (
    <Reveal
      as="section"
      id={item.slug}
      index={index}
      className="min-w-0 rule-t scroll-mt-6 pt-10"
    >
      {/* Wraps rather than truncates. At 320px the title alone is most of the
          column, so the year drops to its own line instead of colliding with
          it — the head is three facts, not a fixed three-column grid. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="flex min-w-0 items-baseline gap-3">
          {/* The matrix numeral is an SVG of dots and is `aria-hidden`: a
              screen reader has no use for a picture of a number. The position
              is still information, so it is spoken here and drawn there. */}
          <span className="sr-only">{ordinal}</span>
          <GlyphText text={ordinal} size="0.5rem" className="shrink-0 text-ink-3" />
          <h2 className="min-w-0 text-xl font-medium tracking-tight">{item.title}</h2>
        </div>
        <SectionLabel>{item.year}</SectionLabel>
      </div>

      <p className="mt-3 mb-6 max-w-[42rem] text-base leading-relaxed text-ink-2">
        {item.oneLiner}
      </p>

      {lede.length > 0 && (
        /* No lead. A full-bleed frame is most of the viewport tall, so 220px of
           early arrival plus its own height is enough to fit the entire
           dissolve before it is on screen — the sweep would run, correctly and
           invisibly, and the frame would simply be there. It arrives when it is
           actually in front of the reader.

           `preloadFirst` only for the first product: a reel does not know where
           it sits, and every reel claiming the preload is four high-priority
           image requests for three frames nobody has scrolled to. */
        <PanelField rootMargin="0px">
          <CaseReel blocks={lede} assets={assets} preloadFirst={index === 0} />
        </PanelField>
      )}

      {more && (
        <>
          {/* A bar, not a chip. The chip this replaces was a small grey pill
              below the reel that read as metadata; a control spanning the
              column, ruled off above, naming what it opens, reads as a door.
              The chevron accompanies the words — it never stands in for them.
              Tall enough to be a comfortable touch target at any width.

              No count rides alongside. It read "N FRAMES" while counting
              blocks, and a block is not a frame — a four-block tail can hold
              six image slots — so the one number on the control was the one
              thing on it that could be wrong. */}
          <button
            type="button"
            onClick={() => {
              setOpen((was) => !was);
              setEverOpened(true);
            }}
            aria-expanded={open}
            aria-controls={panelId}
            className="rule-t mt-8 flex min-h-[2.75rem] w-full items-center justify-between gap-4 py-3 text-left font-mono text-2xs uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-ink"
          >
            <span>{open ? "Close case study" : "Open case study"}</span>
            <span
              className={`inline-block shrink-0 text-ink-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            >
              <GlyphIcon name="chevron-down" size="0.625rem" />
            </span>
          </button>

          <div
            id={panelId}
            data-open={open || undefined}
            className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out data-[open]:grid-rows-[1fr]"
          >
            <div className="overflow-hidden">
              <div className="pt-8">
                {item.intro && item.intro.length > 0 && (
                  <div className="mx-auto max-w-[34rem]">
                    <SectionLabel>Overview</SectionLabel>
                    <div className="mt-2.5 space-y-3">
                      {item.intro.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-[1.6] text-ink-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mx-auto mt-7 max-w-[34rem]">
                  {item.client && <RecordRow label="Client">{item.client}</RecordRow>}
                  {item.role && <RecordRow label="Role">{item.role}</RecordRow>}
                  <RecordRow label="Discipline">
                    <Tags items={item.disciplines} />
                  </RecordRow>
                  {item.stack && <RecordRow label="Stack">{item.stack}</RecordRow>}
                  {item.href && (
                    <RecordRow label="Live">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
                      >
                        {new URL(item.href).hostname.replace(/^www\./, "")}{" "}
                        <GlyphIcon
                          name="arrow-out"
                          size="0.5625rem"
                          className="inline-block align-baseline"
                        />
                      </a>
                    </RecordRow>
                  )}
                </div>

                {item.approach && item.approach.length > 0 && (
                  <div className="mx-auto mt-7 max-w-[34rem]">
                    <SectionLabel>Approach</SectionLabel>
                    <div className="mt-2.5 space-y-3">
                      {item.approach.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-[1.6] text-ink-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="mt-10">
                    {/* The tail takes the assets the lede did not, or it re-shows them. */}
                    {/* Keyed to whether the fold has EVER opened, because a
                        tail collapsed to zero height has frames in the document
                        that no observer can usefully see. The sweep is built
                        when the fold first opens, and never rebuilt after —
                        closing must not re-run it. */}
                    <PanelField revision={everOpened ? 1 : 0} rootMargin="0px">
                      <CaseReel
                        blocks={rest}
                        assets={assets.slice(restAssetOffset)}
                        preloadFirst={false}
                      />
                    </PanelField>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Reveal>
  );
}
