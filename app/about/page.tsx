import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { CopyEmail } from "@/components/copy-email";
import { ExperienceTimeline } from "@/components/experience-timeline";
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

export default function AboutPage() {
  /* Derived, because the hand-written version of this row is what went stale:
     it read "Currently: ChessEver, Hex" for four months after both engagements
     had ended, which is the page telling a visitor something untrue about right
     now. `standing` reads the periods in `data/experience.ts` and picks the
     label to match — the roles the site is holding, or the last one it held —
     and it may only name a company that is in the data.

     No clock is consulted. A build-time `new Date()` would freeze the page's
     idea of "now" at whenever it last deployed, which is the same defect one
     layer down; currency is a property of the record instead, and a role that
     has not ended is written with "Present" as its end. */
  const now = standing(roles);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/about" />

      <header className="mt-12 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[38rem]">
          <h1 className="text-lg font-medium leading-tight tracking-tight">
            &rsquo;{site.name}
          </h1>
          <p className="mt-1.5 text-sm font-medium leading-snug text-ink">
            Product designer and builder creating 0&ndash;1 experiences.
          </p>
          <p className="text-sm leading-snug text-ink-2">
            Specialising in interfaces, systems, and shipping them.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <a
            href={`mailto:${site.email}`}
            className="text-sm text-ink transition-colors hover:text-ink-2"
          >
            {site.email}
          </a>
          <p className="mt-0.5 text-xs text-ink-3">{site.coordinates}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <section>
          <Heading>Practice</Heading>
          <div className="mt-3 max-w-[34rem] space-y-3 text-sm leading-[1.6] text-ink-2">
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

          {/* The ladder is a timeline now, because the roles will not stand in
              a ladder: two of the three ran at the same time. What replaced it
              draws them on an axis instead — tracks beside each other where the
              dates overlap, one track where they do not — with the line that
              travels it as the section's arrival. See the component; the shape
              is derived from the periods, not arranged here.

              The block that used to hold each company's OG image is gone with
              it. It showed whatever `logo` pointed at, which for ChessEver was
              a product screenshot presented as a logo; the marks row the hero
              already draws is the honest version of the same idea and this page
              now calls the same component. There is no `Reveal` around the
              roles any more either — the line is the arrival, and two of them
              on one section would be two things arriving at each other. */}
          <div className="mt-12">
            <Heading>Experience</Heading>
            <div className="mt-5 max-w-[34rem]">
              <ExperienceTimeline roles={roles} />
            </div>
          </div>
        </section>

        <section>
          <Heading>Record</Heading>
          <div className="mt-3">
            <RecordRow label="Based">Lagos, Nigeria</RecordRow>
            <RecordRow label={now.label}>
              {now.roles.map((role, i) => (
                <Fragment key={role.company}>
                  {i > 0 && <span className="text-ink-3">, </span>}
                  <Out href={role.url}>{role.company}</Out>
                </Fragment>
              ))}
            </RecordRow>
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
