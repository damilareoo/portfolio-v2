import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { GlyphText } from "@/components/glyph-text";
import { Portrait } from "@/components/portrait";
import { LocalTime, WeatherReading } from "@/components/record-readings";
import { RoleList } from "@/components/role-list";
import { SiteNav } from "@/components/site-nav";
import { changelog } from "@/data/changelog";
import { roles } from "@/data/experience";
import { elsewhere, site } from "@/data/site";
import { work } from "@/data/work";
import { standing } from "@/lib/experience";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: `Product designer and builder in ${site.city}.`,
};

const host = new URL(site.url).hostname.replace(/^www\./, "");

/**
 * The disciplines, read off the work rather than restated.
 *
 * Already recorded, once, per piece of work: `disciplines` is what a case's own
 * tag row prints. A hand-written list here would be a second copy of the work,
 * and a second copy is what went stale on this page before — it said
 * "Currently: ChessEver, Hex" for four months after both ended.
 *
 * Order is the record's, deduplicated on first appearance. Sorting them would
 * be the page ranking his own practice, which is a claim the data does not
 * make.
 */
const practice = [...new Set(work.flatMap((item) => item.disciplines))];

/**
 * The sheet's two machine-set identifiers.
 *
 * The reference carries a short code under its title block and one long string
 * across the head of the left column. Both are assembled here out of
 * `data/site.ts`, `data/work.ts` and the version at the head of the changelog,
 * so neither can say anything the rest of the record does not — and neither is
 * a serial number. A fabricated identifier is the one thing that would turn
 * this from design into costume: every token below is checkable against a file
 * in this repo.
 */
const shortCode = `${host}/about`.toUpperCase();

const recordId = [
  site.handle,
  site.name.replace(/\s+/g, "-"),
  `${site.city}-${site.country}`,
  site.coordinates.replace(/[°\s]/g, "").replace(",", "-"),
  practice.join("-").replace(/\s+/g, ""),
  `rev-${changelog[0].version}`,
]
  .join(" / ")
  .toUpperCase();

/**
 * The stack, as twelve tiles.
 *
 * The reference closes on twelve small boxed tiles with a caption under each —
 * fingerprints, which are at least nominally its subject's. A row of decorative
 * squares here would be furniture, and this repo's README calls furniture out
 * by name, so the tiles carry the one true thing the site holds twelve of: what
 * he builds with. Every one of these is recorded somewhere else in the repo —
 * nine on the colophon's stack rows, two as `stack` on a case in
 * `data/work.ts`, and Suisse as the four font files in `app/fonts`.
 *
 * The two-letter code is authored rather than derived, and that is the one
 * place a slice of the caption would have been worse than a decision: React and
 * Redis both begin "RE", and two tiles with the same mark in one strip reads as
 * a bug. Naming a thing is not inventing a fact about him.
 */
const AT_HAND: { code: string; name: string }[] = [
  { code: "NX", name: "Next.js" },
  { code: "RE", name: "React" },
  { code: "TS", name: "TypeScript" },
  { code: "TW", name: "Tailwind" },
  { code: "RD", name: "Redis" },
  { code: "VC", name: "Vercel" },
  { code: "SP", name: "Spotify" },
  { code: "HC", name: "Health" },
  { code: "OM", name: "Open-Meteo" },
  { code: "SU", name: "Suisse" },
  { code: "IO", name: "iOS" },
  { code: "AN", name: "Android" },
];

/**
 * A section heading, and the one place on this sheet that is not the mono.
 *
 * The reference sets its body in monospace throughout and then breaks it twice,
 * for two headings in a heavier, wider, letterspaced face. That contrast — one
 * machine-set sheet with a handful of headings in a second face — is a large
 * part of why the design reads as a document rather than as a printout, and it
 * is the one device that cannot be carried by size alone.
 *
 * The site already owns both halves of it: Suisse Int'l Mono sets everything
 * the site says about itself, and Suisse Int'l sets everything a person reads.
 * So the sheet is the mono and the headings are the sans, bold, uppercase and
 * opened up. No typeface was added.
 *
 * `size` is the only variable: the two section headings stand at `lg`, and the
 * pair headings at the foot are the same face and treatment a step smaller,
 * exactly as the reference has them. The trailing ellipsis is the device that
 * makes a heading announce something rather than label it, and it costs
 * nothing.
 */
function SheetHeading({
  size = "lg",
  children,
}: {
  size?: "lg" | "sm";
  children: ReactNode;
}) {
  const Tag = size === "lg" ? "h2" : "h3";
  return (
    <Tag
      className={`font-bold uppercase tracking-widest text-ink ${
        size === "lg" ? "text-lg" : "text-sm"
      }`}
    >
      {children}
      <span className="text-ink-3">&hellip;</span>
    </Tag>
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

/**
 * One row of the spine.
 *
 * The sheet's own row rather than `components/ui.tsx`'s `RecordRow`, and the
 * difference is the whole reason for it: on this sheet both halves are uppercase
 * mono and the label is the heavier weight, where a record row elsewhere on the
 * site is a quiet sans label against a sentence. Pushing this treatment into the
 * shared component would have set the colophon's "Tailwind CSS on CSS custom
 * properties" in shouting capitals to make one page's grid work.
 *
 * **Two columns, but not at 320px.** A fixed label column on a 280px screen
 * leaves 188px for the value, and the longest values here are a list of
 * disciplines and seven links. Below `sm` the label goes above its value
 * instead. That is still a record — a field name, its value, a rule under the
 * pair — and a label column squeezed to nothing was never one.
 */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 rule-b py-2 last:bg-none sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="font-mono text-xs font-medium uppercase tracking-wider text-ink">
        {label}:
      </dt>
      <dd className="font-mono text-xs uppercase tracking-wider text-ink-2">{children}</dd>
    </div>
  );
}

/**
 * One row of the bordered reference table in the header band.
 *
 * Boxed, ruled above the first row as well as under every row, and split by a
 * vertical divider between the two columns — the reference's header table is
 * drawn rather than merely aligned, and an edge round it is what makes it read
 * as a stamp on a document. These are facts about the *sheet* rather than about
 * him, which is what makes them a header rather than three more fields.
 */
function Ref({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] rule-b last:bg-none font-mono text-2xs uppercase tracking-wider">
      <dt className="py-1.5 pr-3 font-medium text-ink-2">{label}</dt>
      <dd className="truncate border-l border-line py-1.5 pl-3 text-ink-3">{children}</dd>
    </div>
  );
}

/**
 * One of the three tagged notes in the middle band.
 *
 * Three columns of small type across the sheet's full width, each opening on a
 * hash-prefixed tag in the heavier weight. The note itself stays in the sans:
 * the mono on this sheet carries what the site says about itself, and these are
 * his own words about his own work. Layout from the reference, voice from the
 * site.
 *
 * The rule stays at every width, on all three, and there is no `last:bg-none`
 * as there is everywhere else on the sheet. At three columns the notes are grid
 * items and stretch to the row, so the three rules land on one baseline and
 * read as a single line broken by the gutters — clearing the last one would
 * leave two thirds of a rule.
 *
 * At 320px the three columns become three record rows: the tag in the label
 * column, the note beside it. That is the answer to the width rather than three
 * stacked paragraphs — stacked, this block stops being dense type on a sheet
 * and becomes an essay, which is the exact thing the page was asked to stop
 * being.
 */
function Note({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1 rule-b py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] md:block md:pt-0 md:pb-4">
      <p className="font-mono text-2xs font-medium uppercase tracking-wider text-ink">{tag}</p>
      <p className="text-sm leading-[1.6] text-ink-2 md:mt-2">{children}</p>
    </div>
  );
}

/**
 * A heading with two lines under it, at the foot of the sheet.
 *
 * The reference stacks two of these in the right half beside its tile strip:
 * the same face as the section headings, a step smaller, two lines of text
 * beneath. See the report for which of the lines under them are his own words
 * and which are standing in until he writes his.
 */
function Pair({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rule-t pt-4">
      <SheetHeading size="sm">{label}</SheetHeading>
      <div className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <p key={line} className="text-sm leading-snug text-ink-2">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * About, as a filed record.
 *
 * **The page is a sheet.** One centred document with ground either side, not a
 * full-bleed web page, and every device below is a device of the reference the
 * owner sent — in its order, at its proportions. The page measure
 * (`max-w-[1240px]`) still governs the nav, because the nav is the site's
 * chrome and the sheet is the document lying on it.
 *
 * Read top to bottom, and each numbered slot is the reference's:
 *
 *   1. A header band in two halves — a mark and a three-part title block on the
 *      left, a bordered three-row reference table on the right.
 *   2. A long identification string, and under it the heaviest rule on the
 *      page. The rule stops at the right edge of the label column rather than
 *      crossing the sheet, and that termination is what sets up the two-column
 *      body under it.
 *   3. The spine: eight label-value fields, uppercase mono throughout, the
 *      label in the heavier weight, a rule under every row.
 *   4. Beside them, level with the first field: the portrait, standing in front
 *      of a graduated board — see `components/portrait.tsx`.
 *   5. A section heading in the sans, a short list one item to a line, and a
 *      small underlined sub-label with a run of text following it.
 *   6. A three-column block of small tagged paragraphs, full sheet width.
 *   7. A second section heading.
 *   8. Twelve boxed tiles, six across and two down, in the sheet's left half.
 *      Beside them: two heading-and-text pairs.
 *   9. One centred line in parentheses, with clear space above it.
 *
 * **Every value is checkable.** The name, the city, the coordinates, the
 * practice, the roles, the handles, the stack tiles and both identification
 * strings are read out of `data/site.ts`, `data/experience.ts`,
 * `data/work.ts`, `data/changelog.ts` and `app/fonts`. Two fields are not
 * filed at all — they are read live, from the same clock and the same Lagos
 * forecast the footer's instruments read, which is what makes this a record
 * being *kept* rather than one typed once.
 *
 * **What is standing in.** Two slots of the reference ask for his own words and
 * the repo does not hold them in a form a page can print: the lines under LIKES
 * and DISLIKES. What is there now is the truest thing available — LIKES is his
 * own statement of what he enjoys, DISLIKES is drawn from positions he has
 * argued for repeatedly on this project — and both are listed in the report as
 * lines for him to replace. The layout does not depend on the sentence.
 *
 * **The boundaries the 1:1 instruction does not lift.** No seal, no agency, no
 * case number, no law-enforcement framing. The mark in the header is his own
 * initials set in the site's matrix alphabet. The reference's own field names —
 * AGE, SEXUALITY, MBTI — are not ours to publish and were never in the repo to
 * publish; a record of a product designer in Lagos holds where he is, what he
 * practises, where else he is, and what the time and the weather are where he
 * is sitting.
 *
 * **Widths.** The sheet takes the full measure on a phone and centres above it.
 * Each two-column device resolves on its own: the header band stacks below
 * `md`, the spine and the portrait stack below `md`, the tagged notes become
 * record rows below `md`, the tile strip runs four across below `sm` and six
 * above, and the two pairs sit under the tiles rather than beside them. The
 * spine's own label column goes above its value below `sm`, and the portrait's
 * board keeps its lines and drops the right-hand numerals.
 */
export default function AboutPage() {
  const current = changelog[0];
  const now = standing(roles);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-12 sm:px-6">
      <SiteNav current="/about" />

      {/* The sheet. Roughly A4 at a browser's 96dpi, which is what makes a
          document read as one sheet rather than as a page that happens to be
          narrow. */}
      <div className="mx-auto mt-12 w-full max-w-[50rem]">
        {/* 1 — The header band, in two halves. */}
        <header className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem] md:items-start md:gap-10">
          <div className="flex gap-4">
            {/* The mark: his initials, set in the matrix's own 3x5 alphabet.
                It is the only mark this site has and the one it draws
                everything else in. Derived from the name, so it cannot come to
                disagree with the line beside it. */}
            <GlyphText
              text={site.name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")}
              size="1.5rem"
              className="mt-1 shrink-0 text-ink-3"
            />
            <div className="min-w-0">
              {/* A lighter line above the heavier one, as the reference has
                  it: what he is, then who. First person, because a record of a
                  person written in the third person about himself is a CV. */}
              <p className="text-sm leading-snug text-ink-2">
                I&rsquo;m a product designer and builder creating 0&ndash;1
                experiences.
              </p>
              <h1 className="mt-0.5 text-xl font-medium leading-tight tracking-tight">
                {site.name}
              </h1>
              <p className="mt-1.5 font-mono text-2xs uppercase tracking-wider text-ink-3">
                {shortCode}
              </p>
            </div>
          </div>

          <dl className="rounded-[var(--radius-tile)] border border-line px-3 py-1">
            <Ref label="Record">About</Ref>
            <Ref label="Source">{host}</Ref>
            <Ref label="Revision">v{current.version}</Ref>
          </dl>
        </header>

        {/* 2, 3 and 4 — The identification string and the heavy rule head the
            left column; the spine runs under them; the portrait stands beside
            all three.

            The heavy rule stopping at the label column's right edge is the
            reference's, and it is load-bearing rather than decorative: it is
            the mark that declares where the sheet divides, so the two-column
            body under it reads as a consequence of the rule rather than as a
            second layout. That is why the string and the rule live inside this
            grid instead of above it.

            Heavy in the site's own vocabulary rather than as a solid bar:
            `--rule-cell` sets a dotted rule's pitch, so raising it thickens
            both the dash and the line and the rule stays the same kind of
            object as every other rule on the sheet. */}
        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8">
          <div>
            <p className="break-words font-mono text-2xs uppercase tracking-wider text-ink-3">
              {recordId}
            </p>
            <div className="mt-2 h-1 rule-b [--rule-cell:5px]" />

            <dl className="mt-4">
              <Field label="Name">{site.name}</Field>
              <Field label="Based">
                {site.city}, {site.country}
              </Field>
              <Field label="Coordinates">{site.coordinates}</Field>
              <Field label="Local time">
                <LocalTime />
              </Field>
              <Field label="Weather">
                <WeatherReading />
              </Field>
              <Field label="Practice">{practice.join(" · ")}</Field>
              <Field label="Elsewhere">
                {elsewhere.map((place, i) => (
                  <Fragment key={place.label}>
                    {i > 0 && <span className="text-ink-3"> · </span>}
                    <Out href={place.href}>{place.label}</Out>
                  </Fragment>
                ))}
              </Field>
              {/* The one value on the sheet that is not uppercased. An address
                  is a string somebody has to be able to read back and type,
                  and shouting it makes it harder to do both. */}
              <Field label="Email">
                <span className="normal-case tracking-normal">
                  <Out href={`mailto:${site.email}`}>{site.email}</Out>
                </span>
              </Field>
            </dl>
          </div>

          <Portrait />
        </div>

        {/* 5 — The first section heading, the short list under it, and the
            underlined sub-label with its run of text. */}
        <section className="mt-14">
          <SheetHeading>Experience</SheetHeading>
          <div className="mt-4">
            <RoleList roles={roles} />
          </div>
          {now.roles.length > 0 && (
            <p className="mt-4 text-sm leading-snug text-ink-2">
              <span className="mr-2 font-mono text-2xs font-medium uppercase tracking-wider text-ink underline decoration-line underline-offset-4">
                Standing
              </span>
              {now.open ? "Currently " : "Most recently "}
              {now.roles.map((role, i) => (
                <Fragment key={role.company}>
                  {i > 0 && <span>{i === now.roles.length - 1 ? " and " : ", "}</span>}
                  {role.role.toLowerCase()} at <Out href={role.url}>{role.company}</Out>
                </Fragment>
              ))}
              .
            </p>
          )}
        </section>

        {/* 6 — The three tagged notes. One paragraph became three, and it was
            already three claims: what he works on, that he builds it, and why
            what he makes is quiet. Set as three tagged columns each claim is
            legible on its own, which is the whole reason a record beats a
            paragraph. Nothing here is new copy. */}
        <div className="mt-12 md:grid md:grid-cols-3 md:gap-x-8">
          <Note tag="#0–1">
            I work on 0&ndash;1 products &mdash; the part where the shape of the
            thing is still an open question.
          </Note>
          <Note tag="#Build">
            I build enough of them myself that the answer has to survive a real
            implementation.
          </Note>
          <Note tag="#Quiet">
            Most of what I make is quiet on purpose: restraint is not the absence
            of an idea, it is what makes the one idea legible.
          </Note>
        </div>

        {/* 7 and 8 — The second section heading, the tile strip in the sheet's
            left half, and the two pairs beside it. */}
        <section className="mt-12">
          <SheetHeading>At hand</SheetHeading>

          <div className="mt-5 grid gap-x-10 gap-y-10 md:grid-cols-2">
            <div className="grid grid-cols-4 gap-x-1.5 gap-y-3 sm:grid-cols-6">
              {AT_HAND.map((tool) => (
                <div key={tool.name}>
                  {/* A tile's corner is not a frame's corner. `--radius-tile`
                      is 12px, which on a 50px square is a lozenge; this is the
                      one literal radius on the sheet, and it is literal because
                      it describes a smaller object than any token was measured
                      for. */}
                  <span className="flex aspect-square items-center justify-center rounded-[5px] border border-line">
                    <GlyphText text={tool.code} size="0.75rem" className="text-ink-3" />
                  </span>
                  <span className="mt-1.5 block break-words text-center font-mono text-2xs leading-tight uppercase tracking-tight text-ink-3">
                    {tool.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <Pair
                label="Likes"
                lines={[
                  "Chess, basketball, running.",
                  "Websites worth studying, which is the whole reason Hitman’s Library exists.",
                ]}
              />
              <Pair
                label="Dislikes"
                lines={[
                  "Copy that narrates instead of saying the thing.",
                  "Mobile designed as a squeezed desktop.",
                ]}
              />
            </div>
          </div>
        </section>

        {/* 9 — The sheet closes on one line in parentheses, which is the
            reference's own last gesture and the only place on this page the
            site speaks about the page. It says the one thing that separates
            this from a CV. */}
        <p className="mt-16 text-center font-mono text-2xs uppercase tracking-wider text-ink-3">
          (End of record. The time and the weather keep reading.)
        </p>
      </div>
    </main>
  );
}
