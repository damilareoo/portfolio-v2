"use client";

import { useId, useState } from "react";
import { CaseReel } from "@/components/case-reel";
import { GlyphIcon } from "@/components/glyph-icon";
import { PanelField } from "@/components/panel-field";
import { RecordRow, SectionLabel, Tags } from "@/components/ui";
import { splitBlocks } from "@/lib/eras";
import { Reveal } from "@/lib/reveal";
import type { CaseBlock, WorkItem } from "@/data/work";
import type { Asset } from "@/data/assets.generated";

/**
 * One piece of work, inside its era.
 *
 * The lede stands open; everything else — the rail prose the case page used to
 * carry, and the rest of the reel — waits behind one control. It waits in the
 * DOM rather than out of it: collapsed with grid rows, not `hidden`, so the
 * whole case study is still crawlable and still found by cmd-F. That is the
 * only thing that survived retiring /work/[slug], and `hidden` would spend it.
 *
 * The open state is deliberately not persisted. Law 3 governs layout the
 * visitor sets, as the DialKit does; a reading position is not a setting, and a
 * portfolio that reopens five dossiers on arrival has forgotten what the
 * collapsed state was for.
 */
export function EraEntry({
  item,
  assets,
  index,
  eraIndex,
}: {
  item: WorkItem;
  assets: Asset[];
  /** Position within the era — drives the arrival stagger. */
  index: number;
  /** Position of the era on the page. Only the first entry of the first era
      is above the fold on arrival, and only it may preload its lede frame. */
  eraIndex: number;
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
  /* The one frame on the page worth a preload tag: the first piece of the
     newest era, the only one a cold load actually renders above the fold. */
  const leadsPage = eraIndex === 0 && index === 0;

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
     half-copied again. */
  return (
    <Reveal as="article" index={index} className="min-w-0">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
        <SectionLabel>{item.year}</SectionLabel>
      </div>
      <p className="mb-5 max-w-[42rem] text-base leading-relaxed text-ink-2">
        {item.oneLiner}
      </p>

      {lede.length > 0 && (
        /* No lead. A full-bleed frame is most of the viewport tall, so 220px of
           early arrival plus its own height is enough to fit the entire
           dissolve before it is on screen — the sweep would run, correctly and
           invisibly, and the frame would simply be there. It arrives when it is
           actually in front of the reader. */
        <PanelField rootMargin="0px">
          <CaseReel blocks={lede} assets={assets} preloadFirst={leadsPage} />
        </PanelField>
      )}

      {more && (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen((was) => !was);
              setEverOpened(true);
            }}
            aria-expanded={open}
            aria-controls={panelId}
            className="mt-5 inline-flex items-center gap-1.5 rounded-[4px] bg-surface-2 px-2 py-1 font-mono text-2xs uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-ink"
          >
            {open ? "Close" : "Open"}
            <span
              className={`inline-block transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
                      <CaseReel blocks={rest} assets={assets.slice(restAssetOffset)} />
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
