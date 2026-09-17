import type { Metadata } from "next";
import { Fragment } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Chip, Section } from "@/components/ui";
import { changelog } from "@/data/changelog";
import { splitTicks } from "@/lib/code-spans";

export const metadata: Metadata = {
  title: "Changelog — Damilare Osofisan",
  description: "Every version of this site, viewable at every point in time.",
};

/* A note, with its code spans set as code. The ticks were printing as ticks —
   see `lib/code-spans.ts` for why this is a splitter and not a parser. */
function Note({ text }: { text: string }) {
  return (
    <>
      {splitTicks(text).map((span, i) => (
        <Fragment key={i}>
          {span.code ? (
            <code className="font-mono text-xs text-ink">{span.text}</code>
          ) : (
            span.text
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Every version, as a record rather than as a stack of cards.
 *
 * What this replaces: thirty-five rounded, bordered panels in a centred
 * 768-pixel column, set in seven literal sizes, under no navigation at all.
 * Four separate things wrong with one page, and the same four were wrong with
 * `/system`:
 *
 *   - **No way out.** Neither page rendered `SiteNav`, and the portfolio
 *     deployment renders no `SiteHeader` either — so the only link off this
 *     page was in a footer thirty-five entries down.
 *   - **Its own measure.** Centred, and narrower than anything else here. The
 *     site is left-aligned on 1240 and has been since the sheet stopped
 *     centring on /about; this page never got the message.
 *   - **Its own type.** One of the two files missing from GOVERNED in
 *     `lib/type-scale.test.ts`, which is the only reason seven sizes off the
 *     scale could live here at all.
 *   - **Cards.** The site has none. A version is not an object on a page; it
 *     is a band of it, and a band is bounded by a rule.
 *
 * The version, the date and the deployment link sit on one line as a record
 * row, the title reads as a heading, and the notes run underneath at the
 * measure prose is read at. Nothing about an entry is drawn; the rule between
 * two of them is the only mark on the page.
 */
export default function ChangelogPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-16 sm:px-6">
        <SiteNav />

        <header className="mt-12 max-w-[38rem]">
          <h1 className="text-lg font-medium leading-tight tracking-tight">Changelog</h1>
          <p className="mt-1.5 text-sm leading-snug text-ink-2">
            Every version of this site, kept. Each entry links to the deployment
            it shipped as, so nothing is lost to a redesign.
          </p>
        </header>

        <Section label={`${changelog.length} versions`}>
          <ol className="max-w-[38rem]">
            {changelog.map((entry, i) => (
              <li key={entry.version} className="rule-b pb-8 pt-8 first:pt-0 last:bg-none">
                {/* Wraps rather than holds one line. Measured at 320: the meta
                    and the link came to more than the column, and the link —
                    which could neither shrink nor drop — was pushed 7px past
                    the viewport, giving every visit on the narrowest phone a
                    horizontal scrollbar. They are two things and are allowed to
                    be two lines. */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
                    <Chip variant="quiet">v{entry.version}</Chip>
                    <span className="font-mono text-xs text-ink-3">{entry.date}</span>
                    {i === 0 && <Chip variant="solid">Current</Chip>}
                  </div>
                  {entry.deployment && (
                    <a
                      href={entry.deployment}
                      target="_blank"
                      rel="noopener noreferrer"
                      /* The site's own floor for something you press, the same
                         one the case-study bar and the instrument cards use. */
                      className="inline-flex min-h-[2.75rem] items-center font-mono text-2xs uppercase tracking-wider text-ink-3 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
                    >
                      View this version
                    </a>
                  )}
                </div>

                <h3 className="mt-3 text-base font-medium tracking-tight">{entry.title}</h3>
                <ul className="mt-3 space-y-2">
                  {entry.notes.map((note) => (
                    <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                      <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-ink-3" />
                      <span className="min-w-0">
                        <Note text={note} />
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>

        <Section label="How this works">
          <p className="max-w-[34rem] text-sm leading-relaxed text-ink-2">
            Every deploy on Vercel gets an immutable URL that never changes and
            never goes away. When a version ships, its deployment URL is
            recorded here — the full history stays browsable even as the live
            site moves on.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
