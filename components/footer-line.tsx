import Link from "next/link";
import { GlyphIcon } from "@/components/glyph-icon";
import { changelog } from "@/data/changelog";
import { site } from "@/data/site";
import { isPortfolio } from "@/lib/site-mode";

/**
 * The one quiet line beneath the instrument wall, written once.
 *
 * It used to be written twice — once in `app/page.tsx`, once in
 * `components/site-footer.tsx` — and the two copies had already drifted. That
 * is the failure this exists to make impossible: whatever is down here is down
 * here on every surface that carries the wall, and there is one place to
 * change it.
 *
 * What is down here is now four links and a way to write. It was twelve.
 *
 * The owner's note was that there is too much going on in the footer and that
 * it should be more intuitive, and the wall is not the part that can go — the
 * hero promises interfaces that behave like instruments and the wall is the
 * evidence for that sentence. So the cut is here, and the seven networks are
 * what went: `elsewhere` in `data/site.ts` is untouched and every one of them
 * is still on /about, set as a label and a handle, which is a better answer to
 * "where else is he" than seven bare words wrapping under a panel. A reader
 * who wants them is one link away and the link is on this line.
 *
 * Two groups rather than one wrapping row, and that is the "more intuitive"
 * half. Left is where you are and where else the site goes; right is how to
 * reach him. A single flex-wrap row put the version pill, an email address and
 * four page names in one undifferentiated queue, and a queue is what a reader
 * has to parse rather than scan.
 *
 * The one thing that varies does not vary by surface — it varies by face.
 * `lib/site-mode.ts` already draws that line: the workshop carries System and
 * Changelog, the public face carries neither. So the version is gated on that
 * const rather than passed as a prop, because a prop is a second place the same
 * distinction could be stated and a second place it could be stated wrongly. It
 * is the only route to /changelog from down here, and it wears no pill: a boxed
 * chip beside a hairline-ruled panel is one more edge on a page that has just
 * been given a single one.
 *
 * `text-xs` sits a step under the readings' values, so the wall is read first
 * and this is what you find when you have finished with it.
 */

/** Everywhere else on the site. /about carries the networks; this carries the site. */
const PAGES = [
  { href: "/shots", label: "Shots" },
  { href: "/about", label: "About" },
  { href: "/colophon", label: "Colophon" },
] as const;

export function FooterLine() {
  const current = changelog[0];

  return (
    /* The `rule-t` is the wall's bottom edge — one pixel, drawn once, by
       whichever element is below it.

       `justify-between` with two groups, and both groups wrap on their own. At
       320px the line becomes two rows — the pages, then the contact — which is
       the same two ideas stacked rather than a single queue broken wherever it
       happened to run out of room. */
    <div className="rule-t flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-4 text-xs">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-medium tracking-tight text-ink">{site.handle}</span>
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="text-ink-2 transition-colors hover:text-ink"
          >
            {page.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <a href={`mailto:${site.email}`} className="text-ink-2 transition-colors hover:text-ink">
          Email{" "}
          <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
        </a>
        {isPortfolio ? null : (
          <Link
            href="/changelog"
            className="font-mono uppercase tracking-wider text-ink-3 transition-colors hover:text-ink"
          >
            v{current.version}
          </Link>
        )}
      </div>
    </div>
  );
}
