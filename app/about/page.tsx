import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { CopyEmail } from "@/components/copy-email";
import { Portrait } from "@/components/portrait";
import { RoleList } from "@/components/role-list";
import { SiteNav } from "@/components/site-nav";
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
    <p className="mt-4 text-sm leading-snug text-ink-2">
      {now.open ? "I’m currently " : "Most recently I was "}
      {now.roles.map((role, i) => (
        <Fragment key={role.company}>
          {i > 0 && <span>{i === now.roles.length - 1 ? " and " : ", "}</span>}
          {role.role} at <Out href={role.url}>{role.company}</Out>
        </Fragment>
      ))}
      . Based in Lagos.
    </p>
  );
}

/**
 * About, cut to the bone.
 *
 * The reference the owner named opens first person with a greeting and a
 * self-description that is not a job title, then a separate *currently*
 * sentence, then experience as company and role. This page had all three and
 * five other things on top of them, and his note on it was that it is too
 * bulky. What went, and why:
 *
 *   - "Specialising in interfaces, systems, and shipping them." A second
 *     tagline directly under a greeting that already says he is a product
 *     designer and builder making 0–1 experiences. Two subtitles is one
 *     subtitle and a repetition.
 *   - Two of the three Practice paragraphs. The one that survives is the one a
 *     visitor could not get from the work itself: what he takes on, and why
 *     what he makes is quiet. The other two narrated it.
 *   - The Practice column's email and coordinates line, which said the address
 *     the copy field below already carries and the city this page now says in
 *     its opening sentence.
 *   - The Record block. Three rows: "Based", which is one short fact and has
 *     moved into the *currently* sentence where it reads as English rather than
 *     as a table row; "Focus: 0–1 products", which is the greeting again; and
 *     "Site: Colophon", which is a link the nav and the footer both carry.
 *   - The experience timeline. See `components/role-list.tsx`.
 *
 * What is left is a greeting, a photograph across the whole measure, one
 * paragraph, the roles, and the ways to reach him. Elsewhere stays and stays
 * whole: the footer stopped carrying the seven networks in this same pass, so
 * this is now the only place on the site that lists them, which is the trade
 * that made the footer worth cutting.
 */
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/about" />

      {/* Words first, and the same order at every width. A reader who has just
          arrived wants to know whose page this is before they meet a face. */}
      <section className="mt-12 max-w-[34rem]">
        {/* First person, and a greeting rather than a title card. The words
            after the comma are the owner's own description of himself. */}
        <h1 className="text-lg font-medium leading-snug tracking-tight">
          Hey &mdash; I&rsquo;m {site.name}, a product designer and builder
          creating 0&ndash;1 experiences.
        </h1>
        <Standing />
      </section>

      {/* The photograph, across the whole measure, still dissolved through the
          glyph engine. It is its own band rather than a column beside the
          words: a 9:16 file in a 24rem column was a portrait the page had made
          room for, and this is the page making room for the portrait. See
          `components/portrait.tsx` for how a tall file goes wide. */}
      <Portrait className="mt-10" />

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          {/* One paragraph, and it is the one thing on this page a visitor
              could not have worked out from the work itself. */}
          <p className="max-w-[34rem] text-sm leading-[1.6] text-ink-2">
            I work on 0&ndash;1 products &mdash; the part where the shape of the
            thing is still an open question &mdash; and I build enough of them
            myself that the answer has to survive a real implementation. Most of
            what I make is quiet on purpose: restraint is not the absence of an
            idea, it is what makes the one idea legible.
          </p>

          <section className="mt-10">
            <Heading>Experience</Heading>
            <div className="mt-4 max-w-[34rem]">
              <RoleList roles={roles} />
            </div>
          </section>
        </div>

        <section>
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

          <div className="mt-6 max-w-[20rem]">
            <CopyEmail email={site.email} />
          </div>
        </section>
      </div>
    </main>
  );
}
