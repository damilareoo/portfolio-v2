"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlyphIcon } from "@/components/glyph-icon";
import type { AppCard } from "@/lib/app-store";

/**
 * An App Store listing, as this site draws it.
 *
 * The owner asked for the two apps to be shown "like the way they are on the
 * app store", embedded and interactive. The embed is impossible — Apple sends
 * `x-frame-options: DENY` and `frame-ancestors 'none'`, so there is no frame to
 * open and no widget to borrow. This is the better answer rather than the
 * consolation one: the store's product header, drawn from the store's own live
 * record, in the site's type and the site's tokens. It matches the page it sits
 * on, it costs no third-party frame, and its rating is current because the
 * lookup is real. See `lib/app-store.ts`.
 *
 * What it carries is what the store's header carries and nothing else: the
 * icon, the listing's name, the seller, the genre, the rating with its count,
 * a way through to the listing, and the screens. No description — the App
 * Store's marketing copy is Apple's voice, and the entry above the card is
 * already the site's.
 *
 * Two things arrive in their own colours: the icon and the screens. That is the
 * same rule the company marks and the album cover follow, and it is not the
 * design system spending a hue — they are quotations of somebody else's
 * artwork, and recolouring a quotation to match the page is a different kind of
 * dishonesty from the one monochrome guards against. Everything the *site*
 * draws here — the plate, the hairlines, the type, the five rating marks — is
 * in the ink tokens.
 *
 * The plate is the reel's plate: the same radius, the same hairline, the same
 * quiet ground a held frame stands on. That is what keeps four products reading
 * as one series when two of them open on a card and two open on a picture.
 *
 * It is the whole of an app entry's open reel, not the first of three frames.
 * The rail below already carries every screen the listing publishes, so a plate
 * repeating the first two of them under the card was the page showing the same
 * pictures twice; they stand behind the entry's control instead. See the split
 * in `components/product.tsx` for the measurements that settled it.
 */
export function AppStoreCard({ app }: { app: AppCard }) {
  const rail = useRef<HTMLUListElement>(null);
  /* Which end of the rail is showing. Reported, not decorative: a control that
     cannot do anything says so by dimming, and Law 4 admits a change of state
     on something the visitor is driving. Server-rendered as "at the start and
     not at the end", which is where an unscrolled rail actually is, so the
     first paint and the first measurement agree. */
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    /* A pixel of slack at each end. Sub-pixel layout means scrollLeft rarely
       lands on exactly 0 or exactly the maximum, and a next button that stays
       lit forever at the far end is the defect this measurement exists for. */
    setEdge({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    measure();
    /* Width decides how much of the rail is visible, so a resize can move the
       far end without anybody scrolling. */
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /**
   * Move the rail by one screen.
   *
   * By one screen rather than by one viewport, because the rail is a row of
   * discrete pictures and a page-sized jump would leave one half-shown at both
   * ends. The step is measured off the first item and the row's own gap rather
   * than written down, because a screen's width is derived from the viewport's
   * height — there is no constant to copy here even if copying one were wise.
   *
   * Smooth unless the visitor asked for less motion. This is motion under
   * touch — a press or a key — which is the first thing Law 4 admits; nothing
   * here moves on its own, and there is no timer in this file.
   */
  const step = useCallback((direction: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const by = first ? first.getBoundingClientRect().width + gap : el.clientWidth;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * by, behavior: still ? "auto" : "smooth" });
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    /* The rail is one tab stop carrying several pictures, so the arrow keys
       have to drive it: a scroll container is only keyboard-scrollable in some
       browsers, and in the rest a keyboard visitor can focus this and then find
       that nothing moves. Home and End are here because a row of eight screens
       is long enough that stepping back through all of them is a chore. */
    const el = rail.current;
    if (!el) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      el.scrollTo({ left: 0 });
    } else if (event.key === "End") {
      event.preventDefault();
      el.scrollTo({ left: el.scrollWidth });
    }
  };

  /**
   * How many of the five marks are lit.
   *
   * Rounded down, and the number beside them carries the precision. A mark in
   * this language is lit or it is not — there is no half-lit dot — so the row
   * has to round somewhere, and down is the only direction the site can round a
   * claim about its own work. 4.73 prints four marks and the figure 4.7; 4.95
   * prints four marks and the figure 4.9. Rounding to nearest would print five
   * of five for both, which is a fuller row than either app has earned.
   */
  const lit = Math.floor(app.rating);
  const rated = app.ratingCount > 0;

  return (
    <div
      /* Not shown, and not a stray. This is how the fallback gets verified:
         break the lookup, load the page, read the attribute. See AppCard. */
      data-store={app.source}
      className="rounded-[var(--radius-tile)] border border-line bg-surface-2"
    >
      {/* Icon, identity, rating, and the way through — the store's own header.

          Two columns on a phone with the control spanning both beneath, three
          columns from `sm` up with the control at the end of the row. It is one
          grid rather than a flex row that wraps, because the control has to
          wrap as a whole: a flex row would shrink the identity column to make
          room for it and set "ChessEver: Follow Live Chess" three words to a
          line at 320px rather than dropping the button under it. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6">
        <Image
          src={app.icon}
          /* Empty on purpose: the name is set immediately beside it, and a
             screen reader announcing "Endgame AI app icon, Endgame AI" is the
             same fact twice. */
          alt=""
          width={512}
          height={512}
          /* Declared, or the optimiser sizes a 64px tile off the 512px source
             and fetches a 1080-wide icon for it. */
          sizes="80px"
          /* An app icon's mask is 22.4% of its side. That is the shape iOS
             draws this artwork in, and a token radius here would be the site
             restating somebody else's mark in its own corner — the same reason
             the marks keep their own colours. It is a percentage rather than a
             length because the tile has two sizes. */
          className="size-16 rounded-[22.4%] border border-line object-cover sm:size-20"
        />

        <div className="min-w-0">
          {/* The listing's name, which is not always the name of the work:
              ChessEver files itself as "ChessEver: Follow Live Chess". The
              product's own title is the h2 three lines up, so this is the
              store's answer rather than a repeat — and it wraps rather than
              truncating, because a truncated name is a fact half-told. */}
          <p className="text-base font-medium leading-snug tracking-tight">{app.name}</p>
          <p className="mt-1 font-mono text-2xs uppercase tracking-wider text-ink-3">
            {app.seller} &middot; {app.genre}
          </p>
          {/* Wraps as two whole things, never mid-phrase. At 320px the identity
              column is 160px and the marks and the figure together measure
              nearer 190, so one of them has to go to a second line — and "4.7 ·
              30" with "RATINGS" alone underneath is a number broken in half. */}
          {rated && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Spoken once, as a sentence; drawn once, as marks and a figure.
                  The same split every number on this site makes — the matrix
                  numerals are a picture of a number and a screen reader has no
                  use for a picture. */}
              <span className="sr-only">
                {`Rated ${app.rating.toFixed(1)} out of 5, from ${app.ratingCount} ratings`}
              </span>
              <span aria-hidden className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <GlyphIcon
                    key={i}
                    name="star"
                    size="0.75rem"
                    className={i < lit ? "text-ink" : "text-ink-3"}
                  />
                ))}
              </span>
              <span
                aria-hidden
                className="whitespace-nowrap font-mono text-2xs uppercase tracking-wider text-ink-3"
              >
                {app.rating.toFixed(1)} &middot; {app.ratingCount.toLocaleString("en-US")}{" "}
                ratings
              </span>
            </p>
          )}
        </div>

        {/* Outlined, not filled. The page has exactly one filled control — the
            call in the hero — and three more slabs would spend what that one is
            for. This is the same hairline-and-mono vocabulary the unfold uses,
            which is the site's word for "the part you press". */}
        <a
          href={app.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${app.name} on the App Store`}
          className="col-span-2 inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-[4px] border border-line px-5 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink-3 sm:col-span-1"
        >
          App Store
          <GlyphIcon name="arrow-out" size="0.5rem" />
        </a>
      </div>

      {/* The screens, on a rail, which is how a listing shows them.

          Nothing advances on its own. Law 4 admits motion under touch, on
          arrival once, or while reporting a live external reading, and a
          carousel that moves by itself is none of the three — it is the page
          deciding what you are looking at. It moves when a finger drags it, a
          trackpad scrolls it, a button is pressed, or an arrow key is held. */}
      {app.shots.length > 0 && (
        <div className="rule-t p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-end gap-2">
            <RailButton
              label="Previous screens"
              icon="arrow-left"
              disabled={edge.start}
              onClick={() => step(-1)}
            />
            <RailButton
              label="Next screens"
              icon="arrow-right"
              disabled={edge.end}
              onClick={() => step(1)}
            />
          </div>
          <ul
            ref={rail}
            /* Focusable, so the arrow keys above have somewhere to be pressed.
               A group rather than a list role, because what is being labelled
               is the rail as one object a visitor lands on. */
            tabIndex={0}
            role="group"
            aria-label={`${app.name} — screens from the App Store listing`}
            onScroll={measure}
            onKeyDown={onKeyDown}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto"
          >
            {app.shots.map((src, i) => (
              <li key={src} className="shrink-0 snap-start">
                <div
                  style={{
                    /* The shape is the listing's own, measured off its files —
                       the lookup payload carries no dimensions, and the two
                       listings' screens differ by a quarter of a percent. */
                    aspectRatio: app.shotRatio,
                    /* Sized by height, and the width follows the shape. That is
                       the one measurement that answers all three screens at
                       once, and two fixed widths at a breakpoint answered none
                       of them.

                       The cap is 46svh because this is a frame and the site
                       already holds that a frame is bounded by the viewport it
                       is being read on — see `--frame-cap`, which is the same
                       rule at 78svh for a frame that has the column to itself.
                       A rail item shares its row, so it takes less. Measured at
                       800x400, the landscape phone this site is checked at, a
                       192px-wide screen stood 417px tall on a 400px viewport:
                       the rail alone was taller than the device. At 46svh it is
                       184 and the whole card fits.

                       The ceiling is 26rem so a tall desktop window does not
                       hand a thumbnail rail half the screen, and it is what
                       keeps the rail a rail: the card's inside measures about
                       1144px at the page's widest and ChessEver publishes six
                       screens, so a screen has to clear roughly 181px for that
                       row to overflow and its two controls to have work to do.
                       26rem of height is 191px of width, which clears it.

                       And on a 375px phone it is 331px tall against the 209 two
                       fixed widths gave — the screens are legible on the one
                       surface where the card is now the entry's whole picture. */
                    height: "min(26rem, 46svh)",
                  }}
                  className="relative overflow-hidden rounded-[var(--radius-tile)] border border-line bg-surface"
                >
                  <Image
                    src={src}
                    alt={`${app.name} — screen ${i + 1}`}
                    fill
                    /* The widest this can ever be, from the ceiling above. A
                       fixed figure rather than a `vh` expression because the
                       optimiser picks a source file, not a layout: over-asking
                       by a little at short viewports costs one size step, and
                       an expression `sizes` cannot evaluate costs the whole
                       image. */
                    sizes="192px"
                    className="object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * One end of the rail's control pair.
 *
 * A bounded hairline square holding a glyph, at a touch size — the shape the
 * unfold settled on for "the part you press", so the two controls on a card do
 * not speak two languages. Only the border and the opacity move, per Law 4;
 * nothing lifts and nothing shadows.
 */
function RailButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: "arrow-left" | "arrow-right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-[4px] border border-line text-ink transition-colors hover:border-ink-3 disabled:opacity-40 disabled:hover:border-line"
    >
      <GlyphIcon name={icon} size="0.75rem" />
    </button>
  );
}
