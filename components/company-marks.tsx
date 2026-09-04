import Image from "next/image";
import { roles, type Role } from "@/data/experience";

/**
 * The companies, as their own marks, with what he did at each of them.
 *
 * This is the hero's first sentence, not an ornament under it. "Most recently
 * for Endgame AI, ChessEver and HEX" leads in and these three lines are its
 * object: the names have become the marks, and each one carries the role it
 * was. A row of logos on its own says he was *near* three companies. The role
 * beside each mark is the half that says what he was, and it is set as text —
 * not a title attribute, not a tooltip — because a tooltip does not exist on a
 * phone and hides the substance on everything else.
 *
 * The trade the arrangement makes, stated plainly: the sentence loses its
 * comma, its "and" and its full stop. Three marks each carrying a role cannot
 * be read as running prose without two identical parentheticals in the middle
 * of it, and the roles are the requirement. Every word survives, in order.
 *
 * One component, two callers. The About ladder takes the same one in phase 4
 * rather than drawing a second, because a mark that reads two ways on two pages
 * is two marks.
 *
 * Each mark is the company's own artwork in the company's own colours. That is
 * not the site spending a hue: `--miss` is still the only colour the design
 * system asks to mean anything, and no token moved for this. A logo is a
 * quotation of someone else's mark, and recolouring a quotation to match the
 * page is a different kind of dishonesty from the one monochrome was guarding
 * against.
 */

/**
 * The cap height every mark is set to, in ems of the type beside it.
 *
 * 0.725 is Suisse Int'l's cap height and Suisse Int'l Mono's, read off the
 * fonts' own OS/2 tables — the two agree to four decimal places, so "the cap
 * height of the type around them" is one number here rather than a choice
 * between two. It is the height of the capital in "ChessEver", and therefore
 * the height the E in "Endgame.ai" and the H in "HEX" are scaled to.
 */
const CAP = 0.725;

/**
 * Clear space around a wordmark inside its tile, in ems.
 *
 * Roughly two thirds of the cap height on the sides and six tenths above and
 * below. A logo set hard against the edge of its own plate reads as a crop of
 * something larger; this is the margin that says the tile is the whole mark.
 */
const PAD_X = 0.5;
const PAD_Y = 0.43;

/** Every mark the site actually holds a file for. */
const marks = roles.flatMap((role) =>
  role.logo && role.mark ? [{ ...role, logo: role.logo, mark: role.mark }] : [],
);

type Marked = (typeof marks)[number];

/** The plate's height in ems once its wordmark's cap is at CAP. */
const plateHeight = (mark: Marked["mark"]) => CAP / mark.cap;

/**
 * One tile height for the whole list, taken from the tallest wordmark rather
 * than chosen. Endgame's is the tall one — cap, plus the sparkle over the `ai`,
 * plus the descender of the `g` — and a height picked by eye would have to be
 * picked again the first time a mark changes.
 */
const TILE_H =
  Math.max(...marks.map((role) => role.mark.height * plateHeight(role.mark))) + 2 * PAD_Y;

const em = (n: number) => `${n.toFixed(4)}em`;

function MarkTile({ role }: { role: Marked }) {
  const { plate, width } = role.mark;
  const plateH = plateHeight(role.mark);
  const plateW = plateH * (plate[0] / plate[1]);
  const tileW = width * plateH + 2 * PAD_X;

  return (
    /* The tile is a window onto the plate, not a box drawn around it. Both
       files are 1200x630 Open Graph lockups that are mostly empty ground, so
       the plate is scaled to put the wordmark at CAP and then cropped to the
       wordmark plus its clear space. What is left is the company's artwork at
       the size of the type beside it, in the colours it was drawn in.

       The hairline is what makes the mark survive the dark skin. Endgame's
       ground is #111111 and the dark skin's is #090909 — a ratio of 1.06, so
       the tile has no visible edge of its own there and the mark floats. The
       border gives it one. On the light skin the same border sits invisibly
       against a near-black tile, which is the right amount of nothing: one
       rule, doing work only on the skin that needs it, and no second copy of
       anyone's logo. */
    <span
      className="relative block shrink-0 overflow-hidden rounded-[3px] border border-line transition-colors group-hover:border-ink-3"
      style={{ width: em(tileW), height: em(TILE_H) }}
    >
      <Image
        src={role.logo}
        alt={role.company}
        width={plate[0]}
        height={plate[1]}
        sizes={`${Math.ceil(plateW * 16)}px`}
        className="absolute max-w-none"
        style={{
          width: em(plateW),
          height: em(plateH),
          left: em((tileW - plateW) / 2),
          top: em((TILE_H - plateH) / 2),
        }}
      />
    </span>
  );
}

export function CompanyMarks({ className = "" }: { className?: string }) {
  return (
    /* A grid rather than three flex rows, so the roles line up in a column of
       their own. The tiles are 88px, 39px and a name set in type: ragged right
       edges would leave the three roles at three indents and the list would
       read as three unrelated facts instead of one record. */
    <ul
      role="list"
      className={`grid w-fit grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 text-sm ${className}`}
    >
      {roles.map((role) => (
        <MarkRow key={role.company} role={role} />
      ))}
    </ul>
  );
}

function MarkRow({ role }: { role: Role }) {
  const marked = role.logo && role.mark ? { ...role, logo: role.logo, mark: role.mark } : null;

  return (
    /* `display: contents` so the item's two cells sit in the parent grid and
       the roles share one column. The list roles are written out because
       contents drops the implicit ones. */
    <li role="listitem" className="contents">
      <a
        href={role.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center"
        style={{ height: em(TILE_H) }}
      >
        {marked ? (
          <MarkTile role={marked} />
        ) : (
          /* No file, so no tile. ChessEver publishes neither a logo nor an OG
             image, and the honest form of that is the site setting the name in
             its own mono at the same cap height as the two marks beside it —
             not a screenshot cropped into the shape of a logo, and not a plate
             in the site's own colours pretending to be artwork. It will read as
             the odd one out in a line of two coloured marks. It is the odd one
             out. A real mark from the company ends it. */
          <span className="whitespace-nowrap font-mono leading-none tracking-tight text-ink transition-colors group-hover:text-ink-2">
            {role.company}
          </span>
        )}
      </a>
      {/* The half that says what he was. Quieter than the mark, because the
          mark is the subject and this is what he did there — but full text at
          the list's own size, never a hover. */}
      <span className="leading-snug text-ink-2">{role.role}</span>
    </li>
  );
}
