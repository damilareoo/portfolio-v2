import Image from "next/image";
import { roles, type Role } from "@/data/experience";

/**
 * The companies, as marks.
 *
 * One component, two callers. The home sets it under the hero's statement as a
 * caption on the sentence that names them; the About ladder takes the same row
 * rather than drawing a second one, because a mark that reads two ways on two
 * pages is two marks.
 *
 * They are evidence, not badges. Nothing here is a chip, a card or a tile: the
 * plate each wordmark arrives on is removed in CSS (see `.mark-ink` in
 * app/globals.css) so what lands on the page is ink, at the weight of the small
 * type around it, on the page's own ground. The row has no heading, because a
 * heading would make it a section rather than a caption.
 *
 * Two of the three are images and the third is set in type, and the row is
 * built so that is not obvious. The one thing that makes a line of wordmarks
 * read as a line rather than as three pictures is a shared cap height, so the
 * type step is what fixes the size and both images are scaled until their caps
 * match it — never the other way round.
 */

/**
 * Suisse Int'l Mono's cap height, as a fraction of the em, read off the font's
 * own OS/2 table rather than guessed. Everything in the row is measured from
 * this: it is the height of the capital in "ChessEver", and therefore the
 * height the E in "Endgame.ai" and the H in "HEX" are scaled to.
 */
const MONO_CAP = 0.725;

/**
 * The row's height, in ems of its own type. It has to clear the tallest ink in
 * the row, which is Endgame's — cap plus the sparkle above the `ai` plus the
 * descender of the `g` measures 1.044em once its cap is at MONO_CAP. Anything
 * above that is only air, because the rest of the plate is invisible by the
 * time it is painted.
 */
const BOX = 1.2;

function MarkImage({ role }: { role: Role & { logo: string; mark: NonNullable<Role["mark"]> } }) {
  const { plate, cap, width } = role.mark;

  /* The plate, scaled until the wordmark's cap height is MONO_CAP. Every other
     number falls out of this one, which is what keeps the two images and the
     one piece of type on a single measure. */
  const plateH = MONO_CAP / cap;
  const plateW = plateH * (plate[0] / plate[1]);

  /* The window is the wordmark's own rectangle, not the plate's: the marks sit
     shoulder to shoulder with the gap between them set by the row, not by how
     much empty ground each company left around its name. Both wordmarks are
     centred in their plates to within a fifth of a percent — measured — so
     centring the plate in the window centres the mark in it. */
  const boxW = MONO_CAP * (width / cap);

  return (
    <span
      className="relative block overflow-hidden"
      style={{ width: `${boxW.toFixed(4)}em`, height: `${BOX}em` }}
    >
      {/* Offsets rather than a translate. A transform creates a stacking
          context, a stacking context isolates blending, and `.mark-ink` gets
          rid of the plate by blending it away — so the one thing that must not
          be used to centre this is the thing that would normally centre it. */}
      <Image
        src={role.logo}
        alt={role.company}
        width={plate[0]}
        height={plate[1]}
        sizes={`${Math.ceil(plateW * 16)}px`}
        className="mark-ink absolute max-w-none opacity-70 transition-opacity group-hover:opacity-100 group-active:opacity-90"
        style={{
          width: `${plateW.toFixed(4)}em`,
          height: `${plateH.toFixed(4)}em`,
          left: `${((boxW - plateW) / 2).toFixed(4)}em`,
          top: `${((BOX - plateH) / 2).toFixed(4)}em`,
        }}
      />
    </span>
  );
}

export function CompanyMarks({ className = "" }: { className?: string }) {
  return (
    <ul role="list" className={`flex flex-wrap items-center gap-x-6 gap-y-3 text-sm ${className}`}>
      {/* `flex` on the item and on the anchor, rather than an inline-level
          child. An inline child puts a line box in the item, and a line box is
          sized by the font's own ascent and descent rather than by the box it
          holds — so the two image marks sat in 21.2px items and the one set in
          type sat in an 18.6px item, and the row centred three things that were
          not the same height. Block-level, the item is the anchor. */}
      {roles.map((role) => (
        <li key={role.company} className="flex">
          <a
            href={role.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center"
            style={{ height: `${BOX}em` }}
          >
            {role.logo && role.mark ? (
              <MarkImage role={{ ...role, logo: role.logo, mark: role.mark }} />
            ) : (
              /* No mark to show, so the site says the name instead of dressing
                 a screenshot up as one. Mono because that is the register the
                 site keeps for labels and readings — the voice it uses when it
                 is stating a fact rather than styling one — and at the same cap
                 height as the two images beside it, which is the whole reason
                 MONO_CAP is a number here at all. Set as the company writes it
                 rather than uppercased: this is standing in for a wordmark, not
                 captioning one. It reads lighter than the two images, because
                 the site has one mono weight and neither wordmark was drawn at
                 it. A real mark from the company would end this. */
              <span className="whitespace-nowrap font-mono leading-none tracking-tight text-ink opacity-70 transition-opacity group-hover:opacity-100 group-active:opacity-90">
                {role.company}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
