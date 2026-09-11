import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { CompanyMark } from "@/components/company-marks";
import { GlyphText } from "@/components/glyph-text";
import { Portrait } from "@/components/portrait";
import { LocalTime, WeatherReading } from "@/components/record-readings";
import { SiteNav } from "@/components/site-nav";
import { roles } from "@/data/experience";
import { elsewhere, site } from "@/data/site";
import { standing } from "@/lib/experience";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: `Product designer and builder in ${site.city}.`,
};

/**
 * About: two paragraphs, the roles, and a photograph that holds the page.
 *
 * The reference is `bruce-cao.com/#about`, and what is taken from it is the
 * arrangement rather than anything else. Its shape, measured off the rendered
 * page at 1440:
 *
 *   - Two columns on one screen. Words on the left in a narrow column, one
 *     large portrait on the right taking a little under half the width, and a
 *     wide gutter between them.
 *   - The left column is **bottom-aligned**, and that is the move that makes
 *     the page: contact links pinned at the top, a long empty stretch, then the
 *     paragraphs and the roles sitting on the floor of the column. The
 *     emptiness is most of the page and it is deliberate.
 *   - Roles as company over title, with the company's mark right-aligned in its
 *     own column so every mark lands on a common edge whatever the name's
 *     length. No dates, no locations, no blurbs.
 *   - It never scrolls. The owner named that last part specifically.
 *
 * What is *not* taken is how it looks. The owner's instruction, twice, and the
 * thing he called his major pain point: it has to be in his own aesthetic. So
 * the reference's full-colour particle canvas is this site's dot-matrix
 * dissolve; its plain links are this site's mono; the rules are the dotted
 * vocabulary every other surface draws; and the two live readings under the
 * links are here because a page about a person, on a site that takes readings,
 * should take one. None of that is in the reference and all of it is his.
 *
 * The record sheet this replaces came from a different reference. What survives
 * of it is the part that was always his: the marks, the dissolve, and the mono.
 */
export default function AboutPage() {
  const now = standing(roles);

  return (
    /* The page is one screen. `svh` rather than `vh` because a phone's toolbars
       make `vh` taller than the glass — the one unit that means what it says on
       the device this is most read on.

       `overflow-hidden` is what lets the picture run off the bottom edge rather
       than lengthening the page to contain it. Scoped to this main, so nothing
       else on the site inherits a rule written for one photograph. Both are
       held to `md`: a phone has no room for a two-column screenful, and forcing
       one there would mean type nobody can read. */
    <main className="mx-auto flex h-[calc(100svh-var(--bar))] w-full max-w-[1240px] flex-col overflow-hidden px-5 py-4 [--bar:54px] sm:px-6">
      <SiteNav current="/about" />

      <div className="mt-8 grid flex-1 gap-10 md:mt-10 md:min-h-0 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16">
        {/* The words, as a numbered sequence.

            The reference stacks its left column one way — contact links pinned
            at the top, a long emptiness, the paragraphs and the roles resting
            on the floor — and that arrangement is *its* idea. Copying it would
            make this page a translation of another page, which is the one thing
            the owner has asked twice that it not be.

            So the sequence comes from this site instead. The home numbers its
            four products in the matrix's own numerals, small and quiet, set
            beside each title; nothing else on the site is numbered. Numbering
            the three things this page says the same way ties About to the work
            rather than to a reference, and it is a device nobody else can use,
            because nobody else has the alphabet.

            Three blocks, in the order somebody reads them: who he is, what he
            has done, and how to reach him. Top-aligned and evenly spaced rather
            than pushed to the floor — a numbered sequence that starts halfway
            down the page is a list that has lost its first item. */}
        <div className="flex min-w-0 flex-col gap-8">
          <Block index={0} label="Practice">
            {/* First person, and a greeting rather than a title card. A record
                of a person written in the third person about himself is a CV. */}
            <h1 className="text-base leading-relaxed text-ink">
              Hey &mdash; I&rsquo;m {site.name}, a product designer and builder
              creating 0&ndash;1 experiences. I work on the part where the shape
              of the thing is still an open question, and I build enough of them
              myself that the answer has to survive a real implementation.
            </h1>
            {/* Derived, not written: `standing` reads the periods and decides
                both the tense and which roles it names. A hand-written line
                here is what said "Currently: ChessEver, Hex" for four months
                after both had ended. */}
            {now.roles.length > 0 && (
              <p className="mt-3 text-base leading-relaxed text-ink-2">
                {now.open ? "Currently " : "Most recently "}
                {now.roles.map((role, i) => (
                  <Fragment key={role.company}>
                    {i > 0 && <span>{i === now.roles.length - 1 ? " and " : ", "}</span>}
                    {role.role.toLowerCase()} at <Out href={role.url}>{role.company}</Out>
                  </Fragment>
                ))}
                . Most of what I make is quiet on purpose: restraint is not the
                absence of an idea, it is what makes the one idea legible.
              </p>
            )}
          </Block>

          <Block index={1} label="Roles">
            <ul role="list">
              {roles.map((role) => (
                <li key={role.company} className="rule-b last:bg-none">
                  <a
                    href={role.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    /* Two columns, and the mark is the second, so every mark
                       lands on one right edge however long the company's name
                       is. `items-center` rather than baseline: a mark is a
                       picture, and a picture aligns to the block beside it. */
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink transition-colors group-hover:text-ink-2">
                        {role.company}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-2xs uppercase tracking-wider text-ink-3">
                        {role.role}
                      </span>
                    </span>
                    {/* The one thing on the page in anybody's colours, and it
                        stays for the reason the album art stays: a company's
                        mark is a quotation, not the design system spending a
                        hue. */}
                    <span className="shrink-0 text-sm">
                      <CompanyMark role={role} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Block>

          <Block index={2} label="Reach">
            <dl>
              <Field label="Email">
                <Out href={`mailto:${site.email}`}>{site.email}</Out>
              </Field>
              <Field label="Elsewhere">
                {elsewhere.slice(0, 3).map((place, i) => (
                  <Fragment key={place.label}>
                    {i > 0 && <span className="text-ink-3"> &middot; </span>}
                    <Out href={place.href}>{place.label}</Out>
                  </Fragment>
                ))}
              </Field>
              {/* Two readings, and they are the reason this page is on this
                  site rather than any site. Law 4's reporting clause: they move
                  because the state does, and stop when it stops. A record
                  carrying a live field is one being kept rather than typed
                  once. */}
              <Field label="Local time">
                <LocalTime />
              </Field>
              <Field label="Weather">
                <WeatherReading />
              </Field>
            </dl>
          </Block>
        </div>

        {/* The picture, and it is the largest thing on the site. Its own column
            because the reference gives it one, and because a photograph beside a
            paragraph is an illustration of that paragraph — this is not that.

            It runs off the bottom of the screen rather than ending on a caption:
            a portrait that finishes inside the fold is an object on the page,
            and one that leaves it is the page. `min-h-0` is what lets the grid
            row hand it the height the column has left rather than the height the
            image would like. */}
        <div className="min-w-0 md:min-h-0">
          <Portrait className="h-full" />
        </div>
      </div>
    </main>
  );
}

/**
 * A link that leaves, in the site's own mono.
 *
 * Underlined on the hairline rather than on the ink, so a column of them reads
 * as a list before it reads as a set of links. The reference's carry no
 * decoration at all, which on a page with this little on it made them hard to
 * find; this is the smallest amount of affordance that fixes it.
 */
function Out({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-mono text-2xs uppercase tracking-wider text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink-3"
    >
      {children}
    </a>
  );
}

/**
 * One row of the record: an uppercase mono label in a fixed column, its value
 * beside it, a dotted rule under the pair.
 *
 * This is the report language the page is written in, and it is the reason the
 * left column reads as a record rather than as a list of links. The label
 * column is fixed so every value starts on one edge — a label column that sizes
 * to its content puts four values at four indents and the rows stop being rows.
 *
 * Below `sm` the pair stacks: a 7rem label column inside a 320px screen leaves
 * the value nine characters, and a record nobody can read is not a record.
 */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rule-b grid gap-x-4 py-2 last:bg-none sm:grid-cols-[7rem_minmax(0,1fr)]">
      <dt className="font-mono text-2xs uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className="min-w-0 text-sm text-ink-2">{children}</dd>
    </div>
  );
}

/**
 * One numbered block of the sequence.
 *
 * The numeral is drawn in the matrix's own alphabet at the size the home draws
 * its product ordinals, and it is `aria-hidden` there for the same reason: a
 * screen reader has no use for a picture of a number. The position is still
 * information, so it is spoken in the label and drawn in the dots.
 *
 * The rule under the heading rather than around the block: a box would make
 * three cards, and three cards is a layout the site does not otherwise have.
 * A rule is a mark, which is the vocabulary every other surface already uses.
 */
function Block({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: ReactNode;
}) {
  const ordinal = String(index + 1).padStart(2, "0");
  return (
    <section>
      <div className="rule-b flex items-baseline gap-3 pb-2">
        <span className="sr-only">
          {ordinal} {label}
        </span>
        <GlyphText text={ordinal} size="0.5rem" className="shrink-0 text-ink-3" aria-hidden />
        <h2 className="font-mono text-2xs uppercase tracking-wider text-ink-3">{label}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
