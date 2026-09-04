import { CompanyMarks } from "@/components/company-marks";
import { FooterLine } from "@/components/footer-line";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { InstrumentWall } from "@/components/instrument-wall";
import { Product } from "@/components/product";
import { SiteNav } from "@/components/site-nav";
import { workAssets } from "@/data/assets.generated";
import { site } from "@/data/site";
import { work } from "@/data/work";

/**
 * The home is the work.
 *
 * There is no index and no selected grid: a lockup, a short record, then three
 * products, numbered, in the order `data/work.ts` lists them. The era layer
 * that used to group them by employer is gone — it spent two of its five
 * sections announcing it had nothing to show, which is furniture arguing with
 * itself. The reference this came from removes its nav for the same reason —
 * if the work is the page, there is nowhere else it could be. The nav stays
 * here only because /shots, /about and /colophon still exist.
 */
export default function Home() {
  /* Padded the same way each product numbers itself, so the count and the
     three ordinals below it read as one system rather than two. */
  const featuredCount = String(work.length).padStart(2, "0");

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6">
      <SiteNav current="/" />

      {/* One band, not a section. The record table it replaces read as a form,
          and ten comma-separated skills was the least evidential thing on the
          page — the work below argues it better. Contact and Elsewhere moved to
          the footer, where a reader looks once they have seen something worth
          writing about. */}
      {/* The name leads, bold, because it is the one fact a visitor should
          leave with even if they read nothing else. The statement — the
          owner's own words, untouched here — follows it, then the record,
          then a way to act on what they just read. On a short viewport the
          band is two columns rather than one stack, for the same reason it
          always was: so the first product still lands on screen rather than
          off the bottom of a landscape phone.

          Four grid children, not two, and that is what makes the two columns
          worth having. Phase 3 attached a role to each company mark, which
          turned the first sentence into a lead-in plus three lines and pushed
          the "Featured work" rule from 372px down an 800x400 screen to 488px —
          off the bottom of it. No spacing retune pays for 116px, and the
          `short` ones that used to buy twenty were reverted rather than kept
          for the smaller number. But the right column on `short-wide` held
          nothing except a contact line and a button, and the marks are the tall
          thing with nowhere to be. So the marks and the closing paragraph are
          grid children in their own right: stacked they sit where they always
          did, and on `short-wide` the marks stand beside the name and the
          paragraph beside the call.

          One set of marks in the DOM either way. A duplicated block would be
          two sets of links for a screen reader and two things to keep in step,
          for a rearrangement that is only ever visual — so document order is
          unchanged and the sentence still reads lead-in, marks, close, on every
          screen.

          The gap moves with them. Stacked, the spacing is the margins these
          elements carried when they were siblings inside one column, so that
          layout is pixel-identical; in two columns the grid's own row gap takes
          over and the margins stand down. */}
      {/* The `short` retune is back, and this time it is paid for. Phase 3
          reverted a pair of these because sixteen pixels could not answer a
          hundred-and-sixteen-pixel regression, which was right: a retune that
          no longer reaches the thing it was justified by is only a smaller
          number. The rearrangement above is what reaches it — 126px of the 116
          back — and these sixteen are what carry the first product's top edge
          from one pixel on screen to twenty, at 800x400 and at the 844x390 that
          is a pixel shorter still. */}
      <header className="mt-10 pb-8 short:mt-4 short:pb-4">
        <div className="grid min-w-0 gap-x-8 short-wide:grid-cols-2 short-wide:items-start short-wide:gap-y-4">
          <div className="min-w-0 short-wide:col-start-1 short-wide:row-start-1">
            <h1 className="text-xl font-bold tracking-tight">&rsquo;{site.name}</h1>
            {/* Demoted from the h1 it used to be: the name now carries that
                role, and this is the second thing said, not a second title.
                `text-lg` sits between the bold name and the `text-base`
                paragraph beneath it on the site's own six-step scale, so all
                three keep a visible order rather than the tagline reading as
                a peer of either neighbour. */}
            <p className="mt-2 max-w-[46ch] text-lg font-medium leading-snug tracking-tight text-ink">
              I design and build the parts of a product people actually touch.
            </p>
            {/* The claim the rest of the page has to keep, and the reason it
                is not one paragraph.

                The copy is "Most recently for Endgame AI, ChessEver and HEX.
                Right now I'm interested in interfaces that behave like
                instruments — screens that report a real reading instead of
                decorating one." The three names in the first sentence are the
                companies' own marks now, so the sentence's object is a list of
                artwork rather than a list of words — and each mark carries the
                role it was, because three logos with nothing attached say he
                was near three companies rather than what he was at them.

                That is what breaks the sentence. Set as running prose it needs
                two identical parentheticals in the middle of it — "(Product
                Designer)" twice — and stops being readable at exactly the
                point it starts being informative. So the first sentence
                becomes its lead-in and three lines, and the second stands on
                its own. Every word survives in order; the comma, the "and" and
                the full stop are what it costs.

                The second sentence is a promise about instruments, and the
                instrument wall in the footer is the evidence for it: nothing
                on this page may be allowed to make that wall quieter, or the
                sentence becomes a thing the site says rather than a thing it
                does. */}
          </div>
          {/* The lead-in travels with what it leads into. Left behind in the
              first column it pointed up and across at a list in the other one,
              which is a sentence with its object on the far side of a gutter. */}
          <div className="mt-3 min-w-0 short-wide:col-start-2 short-wide:row-start-1 short-wide:mt-0">
            <p className="max-w-[46ch] text-base leading-relaxed text-ink-2">
              Most recently for
            </p>
            <CompanyMarks className="mt-2.5" />
          </div>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-2 short-wide:col-start-1 short-wide:row-start-2 short-wide:mt-0">
            Right now I&rsquo;m interested in interfaces that behave like
            instruments &mdash; screens that report a real reading instead of
            decorating one.
          </p>
          <div className="mt-4 min-w-0 short-wide:col-start-2 short-wide:row-start-2 short-wide:mt-0">
            <p className="text-sm text-ink-3">
              Lagos ·{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
              >
                {site.email}
              </a>
            </p>
            {/* Filled, mono, uppercase, tracked: the nav's active chip at CTA
                scale rather than a new control inventing its own language.
                `min-h` clears the touch floor; opacity is the only thing that
                moves, and only under a pointer or a press, per Law 4. */}
            <a
              href={site.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 rounded-[4px] bg-strong px-5 font-mono text-xs uppercase tracking-[0.08em] text-on-strong transition-opacity hover:opacity-90 active:opacity-80"
            >
              Book a call
              <GlyphIcon name="arrow-out" size="0.5rem" />
            </a>
          </div>
        </div>
      </header>

      {/* Sits directly on the rule the first product already draws, so the
          label reads as a caption on that boundary rather than a fourth
          heading stacked above the three below it. The count is spoken as
          text for a screen reader and drawn as the matrix's own numerals for
          everyone else, the same split each product's own number makes. */}
      <div className="flex items-baseline justify-between gap-x-4 pb-2 text-sm text-ink-2">
        <span>Featured work</span>
        <span className="flex items-baseline gap-1.5">
          <span className="sr-only">{featuredCount}</span>
          <GlyphText text={featuredCount} size="0.5rem" className="text-ink-3" />
        </span>
      </div>

      <div className="space-y-20">
        {work.map((item, i) => (
          <Product key={item.slug} item={item} assets={workAssets[item.slug] ?? []} index={i} />
        ))}
      </div>

      {/* Every reading the site takes, in one place, and only here. They used to
          be duplicated in the header, which spent the first screen on something
          nobody came for and made the pair at the foot read as an echo rather
          than as the instruments themselves. Elsewhere sits here rather than in
          the header for the same reason: a reader looks for contact after
          seeing the work, not before it.

          The footer carries no rule and no top padding of its own: the wall
          draws its own top edge and stands flush against it, because a panel
          inset from the rule that bounds it is an object on the page rather
          than the bottom of it. Everything else down here is one quiet line. */}
      <footer className="mt-8 pb-8">
        <InstrumentWall />
        {/* The line under the panel, drawn by the same component every other
            surface that carries the wall draws it with — see
            `components/footer-line.tsx` for why it is not written out here. */}
        <FooterLine />
      </footer>
    </main>
  );
}
