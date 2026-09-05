import Image from "next/image";
import { roles, type Role, type SymbolMark, type Wordmark } from "@/data/experience";

/**
 * A company, as its own mark, at the size of the type around it.
 *
 * This is the hero's sentence, not an ornament under it: "Most recently a
 * product designer at Endgame AI and ChessEver, and design partner at HEX",
 * with the names set as the companies' own artwork. It used to be a lead-in
 * followed by a three-row grid — a mark, a role column, a fixed row height —
 * and the owner's verdict on that was the plainest note in the phase: *"all of
 * this should be like a copy not one after the other like this."* He was right.
 * A list of three logos with a role beside each is a table pretending to be a
 * sentence, and it says he was near three companies rather than what he was at
 * them.
 *
 * The grammar carries the roles now, which is what running prose is for, so the
 * grid, the role column and the row height are gone. What is kept is every
 * number: CAP, `plateHeight`, the tile crop, SYMBOL_H and the ChessEver lockup
 * were measured against real artwork and none of them changed when the list
 * around them did.
 *
 * One component, two callers — the hero's sentence and the About ladder. A mark
 * that reads two ways on two pages is two marks, so the which-treatment
 * decision lives here, once.
 *
 * Each mark is the company's own artwork in the company's own colours. That is
 * not the site spending a hue: `--miss` is still the only colour the design
 * system asks to mean anything, and no token moved for this. A logo is a
 * quotation of someone else's mark, and recolouring a quotation to match the
 * page is a different kind of dishonesty from the one monochrome was guarding
 * against.
 *
 * Two shapes of artwork, and the difference is not only geometry. Endgame's and
 * HEX's files *spell their names*, so the mark can stand in the sentence where
 * the name would and the sentence still names a company. ChessEver's file is a
 * symbol — a plus-shaped field with a king at its centre — and a symbol names
 * nobody who does not already know it. Dropped in alone it would leave the
 * sentence naming two companies and showing a shape for a third. So a symbol is
 * drawn as a **lockup**: the artwork, then the company's name set in the site's
 * own mono at the same cap height the two wordmarks print at. The name stays in
 * the sentence, which is the whole job, and the real artwork is used rather
 * than the bare-type stand-in that preceded it.
 */

/**
 * The cap height every name on the line is set to, in ems of the type beside it.
 *
 * 0.725 is Suisse Int'l's cap height and Suisse Int'l Mono's, read off the
 * fonts' own OS/2 tables — the two agree to four decimal places, so "the cap
 * height of the type around them" is one number here rather than a choice
 * between two. It is the height the E in "Endgame.ai" and the H in "HEX" are
 * scaled to, and it is the height of the C in "ChessEver" for free: mono set at
 * the caller's own font size already has a cap of exactly this, so the name in
 * that lockup joins the other two on one cap line without being scaled at all.
 *
 * It is not what sizes ChessEver's symbol. A symbol has no cap. See SYMBOL_H.
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

/**
 * How tall a symbol prints, in ems of the type beside it.
 *
 * Optical, not mathematical, and that is the whole reason it is its own number
 * rather than CAP. Set to CAP a square reads visibly *smaller* than a wordmark
 * of the same cap standing beside it: the wordmark's ascenders, descenders and
 * anything floating over them spill past the cap band and the square does not,
 * so equal caps hand the square much less than the wordmark of the ink the eye
 * is actually comparing. At 0.725 ChessEver was a speck.
 *
 * 1.12 is where it landed, picked by rendering 0.725, 0.80, 0.88, 0.96, 1.04,
 * 1.12 and 1.20 against the other two on both skins and looking. That is
 * 1.55 x CAP, and 7% over the 1.044em of Endgame's wordmark — the tallest ink
 * on the line. Running past the tallest wordmark rather than matching it is
 * the correction the artwork asks for: this symbol is five blocks with gutters
 * between them, not a solid square, so its silhouette is broken at exactly the
 * top and bottom edges that would otherwise make it read large. 0.96 still
 * looked like a favicon set beside a name. 1.20 made ChessEver the loudest
 * thing on a line where the other two are quotations of the same size.
 *
 * The king decided the close call. It is a few hundred pixels of black at the
 * centre of a mark that prints around 15px, and 1.12 is the step at which it
 * resolves as a notch in the middle square rather than a smudge — the only
 * part of the artwork that says chess, on both skins, because it sits on the
 * mark's own cyan field and never on the page.
 */
const SYMBOL_H = 1.12;

/**
 * The space between a symbol and the name locked up with it, in ems.
 *
 * Held to the tile's own PAD_X, because it is the same measurement: the clear
 * space that says where one mark ends. Reading it off the tile rather than
 * choosing it again keeps the two treatments spending one number, and keeps
 * ChessEver's symbol at the same remove from its name that Endgame's wordmark
 * is from the edge of its plate.
 */
const SYMBOL_GAP = PAD_X;

/** Every company whose file is a wordmark — the only kind that gets a tile. */
const wordmarks = roles.flatMap((role) =>
  role.logo && role.mark?.kind === "wordmark"
    ? [{ ...role, logo: role.logo, mark: role.mark }]
    : [],
);

type Worded = (typeof wordmarks)[number];
type Symboled = Omit<Role, "logo" | "mark"> & { logo: string; mark: SymbolMark };

/** The plate's height in ems once its wordmark's cap is at CAP. */
const plateHeight = (mark: Wordmark) => CAP / mark.cap;

/**
 * One tile height for the whole list, taken from the tallest wordmark rather
 * than chosen. Endgame's is the tall one — cap, plus the sparkle over the `ai`,
 * plus the descender of the `g` — and a height picked by eye would have to be
 * picked again the first time a mark changes.
 *
 * Wordmarks only, deliberately. A symbol is not in this maximum and must not
 * be: the row height is what the tiles are cropped to, and letting a lockup
 * raise it would resize Endgame's and HEX's artwork to accommodate a company
 * that is not in a tile at all. SYMBOL_H is held under it instead.
 */
const TILE_H =
  Math.max(...wordmarks.map((role) => role.mark.height * plateHeight(role.mark))) + 2 * PAD_Y;

const em = (n: number) => `${n.toFixed(4)}em`;

function WordmarkTile({ role }: { role: Worded }) {
  const { plate, width } = role.mark;
  const plateH = plateHeight(role.mark);
  const plateW = plateH * (plate[0] / plate[1]);
  const tileW = width * plateH + 2 * PAD_X;

  return (
    /* The tile is a window onto the plate, not a box drawn around it. Both
       wordmark files are 1200x630 Open Graph lockups that are mostly empty
       ground, so the plate is scaled to put the wordmark at CAP and then
       cropped to the wordmark plus its clear space. What is left is the
       company's artwork at the size of the type beside it, in the colours it
       was drawn in.

       The hairline is what makes the mark survive the dark skin. Endgame's
       ground is #111111 and the dark skin's is #090909 — a ratio of 1.06, so
       the tile has no visible edge of its own there and the mark floats. The
       border gives it one. On the light skin the same border sits invisibly
       against a near-black tile, which is the right amount of nothing: one
       rule, doing work only on the skin that needs it, and no second copy of
       anyone's logo.

       Both halves of that are about the plate. See SymbolLockup for why a mark
       with no plate takes neither. */
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

/**
 * A symbol and the name it does not say, as one mark.
 *
 * No tile and no border, which is a decision rather than an omission. Both
 * exist on the wordmark tiles to serve a plate: the crop is what pulls a
 * wordmark out of 1200x630 of someone else's empty ground, and the hairline is
 * what gives an opaque #111111 plate an edge on a #090909 ground it otherwise
 * measures 1.06 against. ChessEver's file has no plate — it is the artwork,
 * edge to edge, on a genuinely transparent ground — so there is nothing to crop
 * it out of and nothing that needs an edge lending to it. A hairline box drawn
 * around a floating symbol is a box that is not in the artwork, and it would
 * read as a chip the site had put the logo inside. The symbol sits on the page.
 *
 * That leaves the two treatments looking different, and they should: one is a
 * picture of a name and the other is a picture beside a name. What holds the
 * line together is the cap line, not the frame — the C in "ChessEver" is at the
 * same height as Endgame's E and HEX's H, because all three are CAP.
 *
 * The image is decorative and says so. The company's name is right there in
 * text, so alt text would have a screen reader read "ChessEver ChessEver"; the
 * wordmark tiles carry the name in `alt` for exactly the opposite reason.
 */
function SymbolLockup({ role }: { role: Symboled }) {
  const { box } = role.mark;
  const symbolW = SYMBOL_H * (box[0] / box[1]);

  return (
    <span className="flex shrink-0 items-center" style={{ gap: em(SYMBOL_GAP) }}>
      <Image
        src={role.logo}
        alt=""
        width={box[0]}
        height={box[1]}
        sizes={`${Math.ceil(symbolW * 16)}px`}
        className="max-w-none"
        style={{ width: em(symbolW), height: em(SYMBOL_H) }}
      />
      {/* The same span the no-file fallback sets, at the same size, because it
          is the same job: the company's name in the site's mono, whose cap is
          CAP without being scaled to it. */}
      <span className="whitespace-nowrap font-mono leading-none tracking-tight text-ink transition-colors group-hover:text-ink-2">
        {role.company}
      </span>
    </span>
  );
}

/**
 * One company, as itself.
 *
 * Both surfaces draw this one: the hero sets it inline in a sentence, the About
 * timeline stands it in a row. A mark that reads one way in the hero and
 * another on /about is two marks, and the ladder /about used to draw — a 112px
 * box holding whatever `logo` pointed at — was exactly that. It also had
 * ChessEver's product screenshot in it, presented as a logo. The
 * which-treatment decision lives here, once, so neither page can make it
 * differently.
 *
 * Sized in ems throughout, so the caller's own type step sets the cap height —
 * `text-base` in the hero's sentence and `text-sm` on the timeline, and nothing
 * here depends on either. The hover colours ride a `group` the caller opens,
 * because what is hoverable is the link around the mark, not the mark.
 */
export function CompanyMark({ role }: { role: Role }) {
  const { logo, mark } = role;

  if (logo && mark?.kind === "wordmark") {
    return <WordmarkTile role={{ ...role, logo, mark }} />;
  }
  if (logo && mark?.kind === "symbol") {
    return <SymbolLockup role={{ ...role, logo, mark }} />;
  }

  return (
    /* No file at all, so nothing to draw: the name in the site's own mono, at
       the cap height the marks beside it print at. Every company on the site
       has artwork today — ChessEver's arrived and it is a symbol, handled
       above — so this path has no caller, and it stays because it is the
       right answer for the next company to turn up without a file. What it
       refuses is the alternative: a screenshot cropped into the shape of a
       logo, or a plate drawn in the site's own colours pretending to be
       someone's artwork. A name honestly set in type beats either. */
    <span className="whitespace-nowrap font-mono leading-none tracking-tight text-ink transition-colors group-hover:text-ink-2">
      {role.company}
    </span>
  );
}

/**
 * The height a mark stands in, in ems of the type around it.
 *
 * Exported so a caller can give the slot that height whichever treatment the
 * company takes: a wordmark tile is 1.9em tall, a symbol lockup is 1.12em and
 * a name set in mono alone is about 0.7em, and a list that let each take its
 * natural height would step up and down for a reason that is about the site's
 * assets rather than about the companies. The About timeline is that list; the
 * hero is a sentence and lets each mark sit on the line at its own height,
 * which is what an inline mark is for.
 */
export const MARK_HEIGHT = em(TILE_H);
