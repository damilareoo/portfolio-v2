import { Fragment } from "react";
import { CompanyMark } from "@/components/company-marks";
import { FooterLine } from "@/components/footer-line";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { InstrumentWall } from "@/components/instrument-wall";
import { Product } from "@/components/product";
import { SiteNav } from "@/components/site-nav";
import { readAppStore } from "@/lib/app-store";
import { workAssets } from "@/data/assets.generated";
import { site } from "@/data/site";
import { roles } from "@/data/experience";
import { work } from "@/data/work";
import { byRole } from "@/lib/experience";

/**
 * "a" or "an", by the letter the title starts with.
 *
 * Only the first clause of the record takes one — "a product designer at X and
 * Y, and design partner at Z" — because English drops the article on the second
 * of two titles and repeating it reads as two separate announcements. Which
 * title comes first is `data/experience.ts`'s business, so the article cannot
 * be written into the copy.
 */
const article = (title: string) => (/^[aeiou]/i.test(title) ? "an" : "a");

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
export default async function Home() {
  /* One read of the App Store for the whole document, six hours old at most.
     Two of the four products are iOS apps and open on their listing's card;
     `readAppStore` returns a card for both of them whatever Apple says, so
     there is no failure path to branch on here. See `lib/app-store.ts`.

     It is awaited at the top of the page rather than fetched per product
     because `Product` is a client component and because two entries asking the
     same endpoint for the same two rows is one request too many even when Next
     would have deduped it. */
  const apps = await readAppStore();

  /* Padded the same way each product numbers itself, so the count and the
     three ordinals below it read as one system rather than two. */
  const featuredCount = String(work.length).padStart(2, "0");

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6">
      <SiteNav current="/" />

      {/* One band, not a section, and one voice.

          What this replaced first was a record table that read as a form. What
          it replaces now is the shape phase 3 left behind: a lead-in, "Most
          recently for", pointing at three stacked rows of mark-and-role. The
          owner's note on that is the plainest sentence in the phase — *"all of
          this should be like a copy not one after the other like this"* — and
          it is the correct reading. Three logos in a column with a role beside
          each is a table wearing a sentence's clothes.

          So the record is a sentence again and the marks stand inside it, where
          the names would be. The roles are carried by the grammar rather than
          by a column, which is the thing the column was invented to do and the
          reason the sentence broke: two identical parentheticals in the middle
          of running prose. "A product designer at X and Y, and design partner
          at Z" says the same two facts with none of that, because English
          already has a way to give two companies one title.

          Derived from `data/experience.ts`, not written out. `byRole` gathers
          the runs; the article, the lower case and the commas are chosen here,
          because a verb tense is not data and neither is a comma. Two designers
          and one partner is today's grouping, not a rule — a fourth role
          changes the sentence without anybody editing prose.

          Two things left. The email went because "Book a call" is the action
          and the email was the same action said again in a quieter voice — the
          owner's own note. And the gloss on the last sentence went: it used to
          run "— screens that report a real reading instead of decorating one",
          which is the site explaining in words what the four instruments at the
          foot of the page do in front of you. The wall is the evidence; a
          caption on the evidence is not more evidence.

          Two columns on `short-wide` and one stack everywhere else. The
          arrangement is simpler than the four-child grid it replaces because
          the marks are no longer a tall block with nowhere to be — they are
          inside the paragraph. Height is still the scarce axis on a landscape
          phone, so the copy and the call stand side by side there rather than
          spending 400px of screen in sequence. */}
      <header className="mt-10 pb-8 short:mt-4 short:pb-4">
        <div className="grid min-w-0 gap-x-10 short-wide:grid-cols-[minmax(0,1fr)_auto] short-wide:items-start">
          <div className="min-w-0">
            {/* The name leads, bold, because it is the one fact a visitor
                should leave with even if they read nothing else. */}
            <h1 className="text-xl font-bold tracking-tight">&rsquo;{site.name}</h1>
            {/* The claim, in the owner's own words. `text-lg` sits between the
                bold name and the `text-base` paragraph beneath it on the
                six-step scale, so all three keep a visible order rather than
                the tagline reading as a peer of either neighbour. */}
            <p className="mt-2 max-w-[46ch] text-lg font-medium leading-snug tracking-tight text-ink">
              I design and build the parts of a product people actually touch.
            </p>
            {/* The leading is set for the marks rather than for the type.

                A wordmark tile is `MARK_HEIGHT` — 1.9em — because that is what
                puts Endgame's cap on the cap height of the words around it, and
                an inline box that tall makes its own line box taller than the
                strut whatever the line-height says. Left at `leading-relaxed`
                the lines holding a mark would stand 1.9em apart and the lines
                without one 1.63em, so the paragraph would breathe unevenly for
                a reason nobody could see. 2.2 is the tile plus a little air on
                each side, applied to every line, so the block is even and the
                marks sit in it rather than on it. */}
            <p className="mt-4 max-w-[46ch] text-base leading-[2.2] text-ink-2">
              Most recently{" "}
              {byRole(roles).map((run, i) => (
                <Fragment key={`${run.role}-${i}`}>
                  {i > 0 && ", and "}
                  {i === 0 && `${article(run.role)} `}
                  {run.role.toLowerCase()} at{" "}
                  {run.companies.map((role, n) => (
                    <Fragment key={role.company}>
                      {n > 0 && (n === run.companies.length - 1 ? " and " : ", ")}
                      {/* `align-middle` centres the mark on the line's own
                          x-height, which is where a word would sit. The group
                          is opened here because the hoverable thing is the
                          link, not the artwork inside it. */}
                      <a
                        href={role.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={role.company}
                        className="group inline-flex items-center align-middle"
                      >
                        <CompanyMark role={role} />
                      </a>
                    </Fragment>
                  ))}
                </Fragment>
              ))}
              .
            </p>
            {/* The promise the rest of the page has to keep, and the reason the
                instrument wall may never be made quieter: the wall is what
                makes this a thing the site does rather than a thing it says. */}
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-2">
              Right now I&rsquo;m interested in interfaces that behave like
              instruments.
            </p>
          </div>
          <div className="mt-6 min-w-0 short-wide:mt-0">
            {/* One useful fact, and the only place the home says where he is.
                It used to carry the email beside it; see the band's note. */}
            <p className="text-sm text-ink-3">Lagos</p>
            {/* Filled, mono, uppercase, tracked: the nav's active chip at CTA
                scale rather than a new control inventing its own language.
                `min-h` clears the touch floor; opacity is the only thing that
                moves, and only under a pointer or a press, per Law 4. */}
            <a
              href={site.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[2.75rem] items-center gap-2 rounded-[4px] bg-strong px-5 font-mono text-xs uppercase tracking-[0.08em] text-on-strong transition-opacity hover:opacity-90 active:opacity-80"
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
          <Product
            key={item.slug}
            item={item}
            assets={workAssets[item.slug] ?? []}
            index={i}
            app={apps[item.slug]}
          />
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
