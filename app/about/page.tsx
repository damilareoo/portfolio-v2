import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { Portrait } from "@/components/portrait";
import { LocalTime, WeatherReading } from "@/components/record-readings";
import { RoleList } from "@/components/role-list";
import { SiteNav } from "@/components/site-nav";
import { changelog } from "@/data/changelog";
import { roles } from "@/data/experience";
import { elsewhere, site } from "@/data/site";
import { work } from "@/data/work";

export const metadata: Metadata = {
  title: "About — Damilare Osofisan",
  description: `Product designer and builder in ${site.city}.`,
};

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

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-4 pb-8 sm:px-6">
      <SiteNav current="/about" />

      {/* The sheet. Roughly A4 at a browser's 96dpi, which is what makes a
          document read as one sheet rather than as a page that happens to be
          narrow. */}
      <div className="mt-8 w-full [--frame-cap:46svh]">
        {/* The name is the page's heading and nothing on the sheet needs to
            print it twice: the NAME field below carries it for a reader, and
            this carries it for a screen reader and for a crawler. The header
            band that used to stand here — a mark, a tagline, the name set
            large, the address, and a boxed reference table — was five ways of
            saying who this is above a record whose first row says who this
            is. */}
        <h1 className="sr-only">{site.name}</h1>

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
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-start md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
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
        <section className="mt-10">
          <SheetHeading>Experience</SheetHeading>
          <div className="mt-4">
            <RoleList roles={roles} />
          </div>
        </section>

      </div>
    </main>
  );
}
