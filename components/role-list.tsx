import { GlyphIcon } from "@/components/glyph-icon";
import { CompanyMark, MARK_HEIGHT } from "@/components/company-marks";
import type { Role } from "@/data/experience";

/**
 * The roles, as a list: the company's mark, what he was, and when.
 *
 * This replaces the timeline phase 4 built, and the reason is what the hero
 * became. The chart drew concurrency honestly — two lanes, a line travelling
 * the axis in the months it took, rows sized by duration — and none of that was
 * wrong. What changed underneath it is that the home now says "a product
 * designer at Endgame AI and ChessEver, and design partner at HEX" in one
 * sentence, with these same marks in it. Everything the chart said except the
 * shape of two overlapping contracts is on the front page, in prose, and the
 * shape of two overlapping contracts is a fact about scheduling rather than
 * about the work. It was also the largest object on a page the owner called too
 * bulky, and the reference he named lists experience as company and role and
 * nothing else.
 *
 * So: company, role, period. In the record's own order, newest first, which is
 * how a CV is written and what `data/experience.ts` already holds — there is no
 * derived ordering here and nothing parses a date any more. `standing` in
 * `lib/experience.ts` is the last reader of a period, and it reads it to choose
 * a tense.
 *
 * The dates stay, and they are the reason this section exists rather than being
 * deleted outright. Without them it would be the hero's sentence set as a list
 * — the same three companies and the same three roles, on a second page, in a
 * worse format. When is the one thing /about adds.
 *
 * The mark stands in a fixed-height row so a company with a wordmark and one
 * set in type sit on the same line: the difference between them is about which
 * files the site holds, not about the companies.
 */
export function RoleList({ roles }: { roles: readonly Role[] }) {
  return (
    <ul role="list">
      {roles.map((role) => (
        <li key={role.company} className="rule-b py-4 first:pt-0 last:bg-none last:pb-0">
          <a href={role.url} target="_blank" rel="noopener noreferrer" className="group block">
            <span className="flex items-center text-sm" style={{ height: MARK_HEIGHT }}>
              <CompanyMark role={role} />
            </span>
            <p className="mt-2 flex items-baseline gap-1.5 text-sm text-ink">
              <span className="font-medium tracking-tight">{role.role}</span>
              <GlyphIcon
                name="arrow-out"
                size="0.4375rem"
                className="shrink-0 text-ink-3 transition-colors group-hover:text-ink"
              />
            </p>
            {/* One line, and the engagement joins it because "Contract, Mar 2025
                to Apr 2026" is one fact about the arrangement. The location went
                with the chart: a remote contract's city is a fact about neither
                the company nor the work. */}
            <p className="mt-1 text-xs text-ink-3">
              {role.period}
              {role.engagement && ` · ${role.engagement}`}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
