import Link from "next/link";
import { GlyphIcon } from "@/components/glyph-icon";
import { changelog } from "@/data/changelog";
import { elsewhere, site } from "@/data/site";
import { isPortfolio } from "@/lib/site-mode";

/**
 * The one quiet line beneath the instrument wall, written once.
 *
 * It used to be written twice — once in `app/page.tsx`, once in
 * `components/site-footer.tsx` — and the two copies had already drifted: the
 * home carried Shots and Colophon and no way to write to anyone, the workshop
 * routes carried the email and the version and no way back to /shots. Neither
 * was decided; it was two hands editing two files. That is the failure this
 * exists to make impossible: a network added to `elsewhere` in `data/site.ts`
 * now appears on every surface that carries the wall, and the standing
 * question about these links' touch targets gets answered here, once.
 *
 * The one thing that varies does not vary by surface — it varies by face.
 * `lib/site-mode.ts` already draws that line: the workshop carries System and
 * Changelog, the public face carries neither. So the version is gated on that
 * const rather than passed as a prop, because a prop is a second place the
 * same distinction could be stated and a second place it could be stated
 * wrongly. It is the only route to /changelog from down here, and it wears no
 * pill: a boxed chip beside a hairline-ruled panel is one more edge on a page
 * that has just been given a single one.
 *
 * `text-xs` sits a step under the readings' values, so the wall is read first
 * and this is what you find when you have finished with it.
 */
export function FooterLine() {
  const current = changelog[0];

  return (
    /* The `rule-t` is the wall's bottom edge — one pixel, drawn once, by
       whichever element is below it. */
    <div className="rule-t flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-xs">
      <span className="font-medium tracking-tight text-ink">{site.handle}</span>
      <Link href="/shots" className="text-ink-2 transition-colors hover:text-ink">
        Shots
      </Link>
      <Link href="/colophon" className="text-ink-2 transition-colors hover:text-ink">
        Colophon
      </Link>
      {elsewhere.map((place) => (
        <a
          key={place.label}
          href={place.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-2 transition-colors hover:text-ink"
        >
          {place.label}{" "}
          <GlyphIcon name="arrow-out" size="0.5rem" className="inline-block align-baseline" />
        </a>
      ))}
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
  );
}
