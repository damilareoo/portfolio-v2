import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { TokenRow } from "@/components/colophon-instruments";
import { RecordRow } from "@/components/ui";
import { changelog } from "@/data/changelog";
import { isPortfolio } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "Colophon — Damilare Osofisan",
  description: "How this site is built, and what it runs on.",
};

const TOKENS = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "text-3",
  "text-2",
  "text-1",
  "fill-strong",
  "miss",
];

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs text-ink-2">{children}</h2>;
}

function Section({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <Heading>{label}</Heading>
      {note && <p className="mt-2 max-w-[34rem] text-xs leading-[1.6] text-ink-3">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
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

function Inward({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink-3"
    >
      {children}
    </Link>
  );
}

/**
 * The colophon, cut to what a colophon is.
 *
 * It is a statement of how the thing was made. What it had become was a room of
 * demonstrations: a drawing pad, a wall of strangers' drawings, a comment list,
 * five playable toys, and three draggable type specimens — five features on a
 * page whose whole job is four paragraphs and two tables. The owner's note was
 * that it is too bulky and that the game and the register should go.
 *
 * What went, and why:
 *
 *   - **The pad, the register and the comments.** A 12x12 field anyone could
 *     draw on, the last forty drawings, and a flat comment list. Removed
 *     outright, along with `app/api/pad/`, its moderation route, `lib/pad.ts`,
 *     `lib/pad-field.ts`, their tests and `docs/pad-setup.md`. It was the only
 *     place on the site a stranger could write to, which is also what made it
 *     the only thing on the site needing rate limits, length caps, a salted
 *     address hash and a secret-checked takedown route. `PAD_CLIENT_SALT` and
 *     `PAD_MODERATION_SECRET` are now unused; they are still set on Vercel and
 *     the report says so, because deleting someone's environment variables is
 *     not this branch's business.
 *   - **The toys.** Five games on one button, and `lib/glyph/toys.ts` with
 *     them. They were a homage to the Glyph Toys on Phone (3) and they were
 *     genuinely nice; they were also a games console on a page about
 *     typography, and the owner asked for the game to go.
 *   - **The type specimens.** Three samples with a weight picker and a size
 *     drag. A specimen you can set is a good instrument on a type foundry's
 *     site, where you do not already have the face in front of you. Here every
 *     word of the page is already set in the two faces the specimens
 *     demonstrate, so what they added was interaction rather than information.
 *     The Typography row in Stack says the same thing in one line.
 *   - **The readouts panel.** A now-playing row and a build row. The
 *     now-playing row is the third instrument on the footer wall of every page
 *     including this one, and the build was already a row in Stack; the panel
 *     was a second copy of both. `components/readouts.tsx` had no other caller
 *     and went with it. The commit joins the version in Stack, where it belongs
 *     — a build is a fact about what it runs on.
 *
 * What stayed is the answer to "how is this made": the value ladder, which is
 * the one thing on the site that cannot be got by looking; what it runs on; the
 * provenance of the dot language, which is an obligation rather than a feature;
 * and the thanks, which is what a colophon is *for*.
 *
 * The page prerenders again. It was `force-dynamic` because the register had to
 * be read per request, and with the register gone there is nothing on it that
 * changes between two visitors.
 */
export default function ColophonPage() {
  const current = changelog[0];
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-16 sm:px-6">
      <SiteNav current="/colophon" />

      <header className="mt-12 max-w-[38rem]">
        <h1 className="text-lg font-medium leading-tight tracking-tight">Colophon</h1>
        <p className="mt-1.5 text-sm leading-snug text-ink-2">
          How the site is built and what it runs on.
        </p>
      </header>

      <div className="grid gap-x-16 lg:grid-cols-2">
        <Section
          label="Palette"
          note="One value ladder, two skins. Every step is a true grey with equal channels, so the ramp moves on value alone. Each row reads its own live computed value; click to copy the hex. --miss is the only hue the system spends, and it means one thing: a day the step goal was missed. Company marks are reproduced in their own colours, because they belong to someone else."
        >
          <div className="max-w-[26rem]">
            {TOKENS.map((token) => (
              <TokenRow key={token} token={token} />
            ))}
          </div>
        </Section>

        <Section label="Stack" note="What it runs on, and what the instruments read from.">
          <div className="max-w-[26rem]">
            <RecordRow label="Framework">Next.js, React, TypeScript</RecordRow>
            <RecordRow label="Styling">Tailwind CSS on CSS custom properties</RecordRow>
            <RecordRow label="Type">Suisse Int&rsquo;l, and its mono for anything the site says about itself</RecordRow>
            <RecordRow label="Store">Upstash Redis</RecordRow>
            <RecordRow label="Music">Spotify, dithered to a dot field</RecordRow>
            <RecordRow label="Steps">Health Connect, pushed from the phone</RecordRow>
            <RecordRow label="Weather">Open-Meteo, for Lagos</RecordRow>
            <RecordRow label="Hosting">Vercel</RecordRow>
            <RecordRow label="Build">
              <Inward href="/changelog">
                v{current.version} — {current.title}
              </Inward>
              {commit && <span className="text-ink-3"> · {commit.slice(0, 7)}</span>}
            </RecordRow>
            {!isPortfolio && (
              <RecordRow label="Workshop">
                <Inward href="/system">System</Inward>
              </RecordRow>
            )}
          </div>
        </Section>

        <Section label="Provenance">
          <div className="max-w-[34rem] space-y-3 text-sm leading-[1.6] text-ink-2">
            <p>
              The dot-matrix language here is an original web implementation and
              a homage to Nothing&rsquo;s interface &mdash; the Glyph Matrix on
              Phone (3). No Nothing code, assets, or trademarks are used: the
              glyphs, the alphabet, and the engine that draws them were written
              for this site.
            </p>
            <p>
              The steps card reports how far a day went and nothing else. There
              is no GPS on this site and none is planned.
            </p>
          </div>
        </Section>

        <Section label="Thanks">
          <div className="max-w-[34rem] space-y-3 text-sm leading-[1.6] text-ink-2">
            <p>
              <Out href="https://intempus.org">Intempus</Out>, whose colophon
              established the labelled-record structure this one descends from.
            </p>
            <p>
              <Out href="https://guglieri.com/work">Guglieri</Out>,{" "}
              <Out href="https://kprkr.co/work">kprkr</Out>, and{" "}
              <Out href="https://rghv.ca">rghv</Out>, for the argument that
              metadata is the aesthetic and hierarchy is expressed as room.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}
