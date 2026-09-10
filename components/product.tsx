"use client";

import { Fragment, useId, useState } from "react";
import { AppStoreCard } from "@/components/app-store-card";
import { CaseReel } from "@/components/case-reel";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { PanelField } from "@/components/panel-field";
import { RecordRow, SectionLabel, Tags } from "@/components/ui";
import { appReel } from "@/lib/app-reel";
import { LEDE_BLOCKS, splitBlocks } from "@/lib/case-blocks";
import { Reveal } from "@/lib/reveal";
import type { AppCard } from "@/lib/app-store";
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
 * Two of the four are iOS apps and open on their App Store card instead of on
 * a frame. That is the only branch in here, and it is one question — does this
 * entry have a listing — rather than a switch on a slug. It decides two things
 * and no more: where the frames come from, and how many of them stand open.
 *
 * The lede stands open; everything else — the rail prose the case page used to
 * carry, and the rest of the reel — waits behind one control. It waits in the
 * DOM rather than out of it: collapsed with grid rows, not `hidden`, so the
 * whole case study is still crawlable and still found by cmd-F. That is the
 * only thing that survived retiring /work/[slug], and `hidden` would spend it.
 *
 * The open state is deliberately not persisted. Law 3 governs layout the
 * visitor sets — the skin is the one thing left that qualifies; a reading
 * position is not a setting, and a portfolio that reopens three dossiers on
 * arrival has forgotten what the collapsed state was for.
 */
export function Product({
  item,
  assets,
  index,
  app,
}: {
  item: WorkItem;
  assets: Asset[];
  /** Position on the page. Drives the number, the arrival stagger, and the one
      preload — only the first product is above the fold on a cold load. */
  index: number;
  /**
   * The App Store listing, for the two entries that are iOS apps.
   *
   * Handed in rather than looked up. The lookup is a server fetch on a six-hour
   * cache and this component is `"use client"`, so the page reads the store once
   * for the whole document and each app entry is given its own card. Absent for
   * everything that is not an app, which is what makes the branch below a
   * question about this entry rather than a switch on its slug.
   */
  app?: AppCard;
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

  /* An app's frames come from its listing, not from `public/work`. The reel it
     is given replaces the authored one rather than joining it: the card is the
     entry's open frame and the store's screens are what waits behind the
     control. Nothing is deleted to arrange that — ChessEver's six authored
     blocks and its one committed file are still in the repo.

     Art with no blocks authored for it is still worth showing: fall back to one
     full frame per asset, in filename order — as the case page did. */
  const blocks: CaseBlock[] = app
    ? appReel(app)
    : item.blocks && item.blocks.length > 0
      ? item.blocks
      : assets.map<CaseBlock>((asset) => ({ kind: "full", alt: asset.title }));

  /* An app spends its whole lede on the card: zero blocks open, one plate
     behind the control. That is the subtraction the card paid for, and it is
     the one that mattered.

     The card ends in a rail of every screen the listing publishes. A plate
     holding the first two of those screens, set directly beneath it, was the
     same two pictures twice inside one screen — 1043px of them on a 375px
     phone, which made an app entry 1786px tall against 751 for Sylvan and put
     two of the four products at nearly twice the height of the other two. Four
     products cannot read as one series when half of them are double the object.
     Moving the plate behind the fold takes an app entry to roughly Sylvan's
     height, removes the repetition from the surface everyone scans, and loses
     nothing: the screens are still on the rail, and they are still on the plate
     for anybody who opens the case.

     The frame count is unchanged — card, then two snips, exactly what phase 6
     allows — and so is `LEDE_BLOCKS` for the two entries that are not apps. */
  const { lede, rest, restAssetOffset } = splitBlocks(blocks, app ? 0 : LEDE_BLOCKS);
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
      {/* A number and a title, and that is the whole head now.

          The year used to sit at the right end of this row and it has gone
          into the record below, where the other six facts about a piece
          already live. This is the subtraction the App Store card paid for:
          two of the four products now open on a card carrying an icon, a
          seller, a rating and a rail of screens, which is more furniture per
          entry than the page had before — so something on the scanned surface
          had to leave, and the year is the one thing here that four products
          in a column repeat four times while telling a reader almost nothing.
          It is not lost; it is one row lower, next to Role and Stack, which is
          where somebody who wants it goes to look.

          One line at every width as a result. The row it replaces wrapped at
          320px so the year could drop under the title, and it no longer has
          anything to wrap. */}
      <div className="flex min-w-0 items-baseline gap-3">
        {/* The matrix numeral is an SVG of dots and is `aria-hidden`: a screen
            reader has no use for a picture of a number. The position is still
            information, so it is spoken here and drawn there. */}
        <span className="sr-only">{ordinal}</span>
        <GlyphText text={ordinal} size="0.5rem" className="shrink-0 text-ink-3" />
        <h2 className="min-w-0 text-xl font-medium tracking-tight">{item.title}</h2>
      </div>

      <p className="mt-3 mb-6 max-w-[42rem] text-base leading-relaxed text-ink-2">
        {item.oneLiner}
      </p>

      {/* The store's product header, and the whole of this entry's open reel.
          See `components/app-store-card.tsx`: it is a plate in the reel's own
          tokens, so an app entry and a website entry are still the same kind of
          object on the same page — a rule, a number, a title, a line, a
          picture, a door. */}
      {app && <AppStoreCard app={app} />}

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

              The shape was right and the weight was wrong. It sat at
              `text-2xs` — the smallest size on the entire site — in the muted
              ink, which put the page's primary action below every caption
              around it: findable only if you already knew it was there. It is
              a step up the scale now and in the primary ink, which is the
              least a door can be on a page you are scanning. It still does not
              fill or tint, because the artwork above it is the thing being
              looked at and a slab here would win an argument it should not be
              having.

              The glyph is held in a bounded box for the same reason. Loose on
              the rule at 0.625rem it read as a mark pointing at something;
              inside a hairline square at the site's own radius, at a touch
              size, it reads as the part you press. The box does not turn — a
              rotated square is a square — so the rotation stays on the glyph
              inside it.

              Only opacity moves on the control and only colour on the box, per
              Law 4. Nothing lifts and nothing shadows.

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
            className="group rule-t mt-8 flex min-h-[2.75rem] w-full items-center justify-between gap-4 py-2 text-left font-mono text-xs uppercase tracking-[0.08em] text-ink transition-opacity hover:opacity-85 active:opacity-70"
          >
            {/* Never wraps. At 320px the card is 280px and the longer label
                measures 128px, so the row has room — but a label that wrapped
                would take the glyph with it and the control would look like an
                accident. */}
            <span className="whitespace-nowrap">
              {open ? "Close case study" : "Open case study"}
            </span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-line transition-colors group-hover:border-ink-3">
              <span
                className={`inline-flex transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              >
                <GlyphIcon name="chevron-down" size="0.75rem" />
              </span>
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
                  {/* First, because it is the coarsest thing anybody asks about
                      a piece of work and because the head no longer says it. */}
                  <RecordRow label="Year">{item.year}</RecordRow>
                  {item.client && <RecordRow label="Client">{item.client}</RecordRow>}
                  {item.role && <RecordRow label="Role">{item.role}</RecordRow>}
                  {/* Rendered only when there are names. A case with none has
                      no row here at all — not an empty one and not an em dash
                      standing in for one, because a record that prints a blank
                      is claiming the question was asked and came back empty,
                      and for most of this work it was never asked.

                      A comma between people and the role in brackets after
                      the name it belongs to. The middot the rest of the site
                      uses for lists was tried here and read wrong: set in the
                      quiet ink beside a comma in the same ink, "Ada Lovelace ·
                      Engineering, Grace Hopper" groups as one phrase and two
                      names rather than as two people. Brackets close the
                      question without a second colour. Names that carry a site
                      are links in the same
                      underlined treatment every other outbound name on the
                      site uses; names that do not are plain text, which is
                      what stops a name without a site reading as a link that
                      broke. */}
                  {item.collaborators && item.collaborators.length > 0 && (
                    <RecordRow label="With">
                      {item.collaborators.map((person, i) => (
                        <Fragment key={person.name}>
                          {i > 0 && <span className="text-ink-3">, </span>}
                          {person.url ? (
                            <a
                              href={person.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
                            >
                              {person.name}
                            </a>
                          ) : (
                            person.name
                          )}
                          {person.role && (
                            <span className="text-ink-3"> ({person.role})</span>
                          )}
                        </Fragment>
                      ))}
                    </RecordRow>
                  )}
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
