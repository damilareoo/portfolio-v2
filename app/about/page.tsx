import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { Portrait } from "@/components/portrait";
import { SiteNav } from "@/components/site-nav";
import { RecordRow } from "@/components/ui";
import { roles } from "@/data/experience";
import { elsewhere, site } from "@/data/site";
import { standing } from "@/lib/experience";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: "Product designer and builder in Lagos.",
};

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs text-ink-2">{children}</h2>;
}

function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
    >
      {children}
    </a>
  );
}

/**
 * What he is doing now, as a sentence, from the record rather than by hand.
 *
 * The page said "Currently: ChessEver, Hex" for four months after both ended.
 * `standing` answers whether anything is open and which roles say so; the verb
 * tense is chosen here, because a tense is a property of the sentence and not
 * of the data. Nothing in it can name a company that is not in
 * `data/experience.ts`, and no clock is consulted — a role that has not ended
 * is written with "Present" as its end, and that word is what flips this line
 * back to the present tense.
 */
function Standing() {
  const now = standing(roles);
  if (now.roles.length === 0) return null;

  return (
    <p className="mt-4 text-sm leading-snug text-ink">
      {now.open ? "I’m currently " : "Most recently I was "}
      {now.roles.map((role, i) => (
        <Fragment key={role.company}>
          {i > 0 && <span>{i === now.roles.length - 1 ? " and " : ", "}</span>}
          {role.role} at <Out href={role.url}>{role.company}</Out>
        </Fragment>
      ))}
      .
    </p>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/about" />

      {/* The opening band: the portrait, the greeting, and the prose.

          Three arrangements of the same three blocks, and the document order is
          the same in all of them — greeting, portrait, prose. On a phone that
          order is the layout: the words come first, because a reader who has
          just arrived wants to know whose page this is before they scroll past
          a face, and the portrait sits under the greeting at about three
          quarters of the column, inset, so it reads as a print laid on the page
          rather than a header they have to get past.

          From `sm` the portrait takes a column of its own on the left and the
          greeting and the prose stack to its right — the arrangement the
          picture was actually chosen for, a tall 9:16 standing beside a
          measure of text. It is placed by the grid rather than by its position
          in the markup, so nothing moves for a screen reader when the columns
          appear.

          The portrait is above the Experience section rather than beside it on
          purpose. It belongs with the sentence that says who he is; the
          timeline is a record, and a face beside a record reads as a byline on
          it. */}
      {/* `grid-rows-[auto_1fr]` is load-bearing, not tidiness. The portrait
          spans both rows and is taller than the two text blocks together, so
          with automatic rows the grid hands the surplus to *both* of them —
          measured at 1440, 114px of it landed between the greeting and
          "Practice", opening a hole in the middle of a paragraph's worth of
          nothing. A `1fr` second row takes the free space instead, and the
          greeting keeps the height it asked for. */}
      <section className="mt-12 grid items-start gap-y-8 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:grid-rows-[auto_1fr] sm:gap-x-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-x-14">
        <div className="max-w-[34rem] sm:col-start-2 sm:row-start-1">
          {/* First person, and a greeting rather than a title card. The words
              after the comma are the owner's own description of himself,
              unchanged; what is new is that the page now says hello with them
              instead of announcing a name and then a job. */}
          <h1 className="text-lg font-medium leading-snug tracking-tight">
            Hey &mdash; I&rsquo;m {site.name}, a product designer and builder
            creating 0&ndash;1 experiences.
          </h1>
          <p className="mt-2 text-sm leading-snug text-ink-2">
            Specialising in interfaces, systems, and shipping them.
          </p>
          <Standing />
        </div>

        <Portrait className="w-3/4 sm:col-start-1 sm:row-start-1 sm:row-span-2 sm:w-full" />

        {/* Stretched, with the contact line pushed to the foot of it, so the
            column ends level with the bottom edge of the picture instead of
            three hundred pixels above it. The white below the prose is then a
            decision rather than a leftover. */}
        <div className="flex max-w-[34rem] flex-col sm:col-start-2 sm:row-start-2 sm:self-stretch">
          <Heading>Practice</Heading>
          <div className="mt-3 space-y-3 text-sm leading-[1.6] text-ink-2">
            <p>
              I work on 0&ndash;1 products &mdash; the part where the shape of the
              thing is still an open question &mdash; and I build enough of them
              myself that the answer has to survive contact with a real
              implementation.
            </p>
            <p>
              That means the design work does not stop at a file. Interface,
              system, and the code that makes it move are one job, and the ones
              that ship are the ones where nobody had to translate between them.
            </p>
            <p>
              Most of what I make is quiet on purpose. Restraint is not the
              absence of an idea; it is what makes the one idea legible.
            </p>
          </div>
          <p className="mt-5 text-sm text-ink-3 sm:mt-auto sm:pt-8">
            <a
              href={`mailto:${site.email}`}
              className="text-ink transition-colors hover:text-ink-2"
            >
              {site.email}
            </a>
            <span className="px-1.5">·</span>
            {site.coordinates}
          </p>
        </div>
      </section>

      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <section>
          {/* Company and role lead each entry now; the dates have moved beneath
              them. The reference the owner named lists experience as company and
              role only and lets the sequence carry it, and that turns out to
              settle an argument this section was having with itself: while the
              period was the first thing read, two overlapping roles were a
              contradiction the layout had to resolve on screen. Read as a
              sequence of companies, the overlap is simply a fact recorded lower
              down. The dates are still on the page, still exact, and still the
              thing the tracks are built from. */}
          <Heading>Experience</Heading>
          <div className="mt-5 max-w-[34rem]">
            <ExperienceTimeline roles={roles} />
          </div>
        </section>

        <section>
          <Heading>Record</Heading>
          <div className="mt-3">
            <RecordRow label="Based">Lagos, Nigeria</RecordRow>
            <RecordRow label="Focus">0&ndash;1 products</RecordRow>
            <RecordRow label="Site">
              <Link
                href="/colophon"
                className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
              >
                Colophon
              </Link>
            </RecordRow>
          </div>

          <div className="mt-8">
            <Heading>Elsewhere</Heading>
            <div className="mt-3">
              {elsewhere.map((place) => (
                <a
                  key={place.label}
                  href={place.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 rule-b py-2.5 last:bg-none sm:grid-cols-[96px_minmax(0,1fr)]"
                >
                  <span className="text-xs text-ink-3">{place.label}</span>
                  <span className="text-sm text-ink-2 transition-colors group-hover:text-ink">
                    {place.handle}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6 max-w-[20rem]">
            <CopyEmail email={site.email} />
          </div>
        </section>
      </div>
    </main>
  );
}
