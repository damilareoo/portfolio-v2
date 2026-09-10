import { GlyphIcon } from "@/components/glyph-icon";
import { CompanyMark, MARK_HEIGHT } from "@/components/company-marks";
import type { Role } from "@/data/experience";

/**
 * The roles, one to a line: the company's mark, the title after a dash, the
 * dates at the end of the row.
 *
 * This is the short list the sheet's first section heading stands over, and the
 * shape is the reference's: one item per line, each carrying a second element
 * after a dash, ruled underneath. It replaces a three-block list that stacked
 * the mark, then the title, then the period — three lines per role, on a sheet
 * whose whole argument is that a fact takes one.
 *
 * The marks survive the compression and they are the reason this is a component
 * rather than three lines of JSX on the page. A wordmark is cropped out of its
 * plate and scaled so its cap height matches the type beside it, and that
 * arithmetic is driven by the row's own font size — so the row has to be set
 * here, next to the height the tiles are cropped to. `MARK_HEIGHT` is that
 * height, and a company with a symbol rather than a wordmark stands in a lockup
 * of the same cap. See `components/company-marks.tsx`.
 *
 * The marks are also the one thing on the sheet in anybody's colours, and they
 * stay for the reason the album art stays: a company's mark is a quotation, not
 * the design system spending a hue.
 *
 * The title is italic, which on a sheet set almost entirely in uppercase mono
 * is the cheapest possible way to say that the two halves of the line are
 * different kinds of thing — the company is a name and the title is a
 * description of what he did there.
 *
 * The dates stay, and they are the reason this section exists rather than being
 * deleted outright. Without them it would be the home's own sentence set as a
 * list — the same three companies and the same three roles, on a second page,
 * in a worse format. When is the one thing /about adds. The engagement joins
 * them because "Contract, Mar 2025 to Apr 2026" is one fact about the
 * arrangement; the location went with the timeline, since a remote contract's
 * city is a fact about neither the company nor the work.
 */
export function RoleList({ roles }: { roles: readonly Role[] }) {
  return (
    <ul role="list">
      {roles.map((role) => (
        <li key={role.company} className="rule-b last:bg-none">
          <a
            href={role.url}
            target="_blank"
            rel="noopener noreferrer"
            /* Wraps rather than truncates. At 320px the company, its title and
               its dates do not fit on one line and the dates drop to their own
               — which is a row that wrapped, not a row that broke. */
            className="group flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5 text-sm"
          >
            <span className="flex items-center" style={{ height: MARK_HEIGHT }}>
              <CompanyMark role={role} />
            </span>
            <span className="text-ink-3">&mdash;</span>
            <span className="italic text-ink-2 transition-colors group-hover:text-ink">
              {role.role}
            </span>
            <GlyphIcon
              name="arrow-out"
              size="0.4375rem"
              className="shrink-0 text-ink-3 transition-colors group-hover:text-ink"
            />
            <span className="ml-auto font-mono text-2xs uppercase tracking-wider text-ink-3">
              {role.period}
              {role.engagement && ` · ${role.engagement}`}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
