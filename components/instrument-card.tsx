// components/instrument-card.tsx
import type { ReactNode } from "react";

/**
 * The measure every face is drawn at. One number, because the defect this
 * component exists to fix was four instruments at four sizes — a large disc, a
 * medium card, a small clock — with no shared baseline between them. The card
 * applies this to the face itself (not just to a grid cell around it), so a
 * card rendered outside the bank's grid is still the right size.
 */
export const CARD_FACE = 96;

/**
 * One instrument, in the shape every instrument takes.
 *
 * The card owns footprint, radius and where the label sits; the face inside
 * owns only what it reads. That division is the whole argument: a bank of
 * readings rather than a collection of widgets. There is no padding here —
 * the face sits flush to the card's own edge — so this shell claims none.
 *
 * `reading` absent, empty or whitespace-only are all treated as "nothing to
 * report": the card prints an em dash and keeps its label rather than a blank
 * value next to a live-looking label, because an instrument that cannot read
 * must say so — a blank card reads as broken, and a stale one lies.
 *
 * There is no `interactive` prop. Whether the card is a control is derived
 * from whether `onPress` was given, because a boolean that can disagree with
 * the handler is exactly how a dead button gets built by accident — "a
 * control that does nothing is a lie told with a cursor" should be
 * impossible to construct, not just discouraged in a comment.
 */
export function InstrumentCard({
  label,
  reading,
  onPress,
  pressLabel,
  children,
}: {
  label: string;
  /** The value, if there is one. Absent, empty or blank all render the dash. */
  reading?: string;
  /** Present only when the card has a second face to turn to; its presence
   *  is what makes the card a control — see the docblock above. */
  onPress?: () => void;
  /** The button's accessible name, when "turn this card" is not the whole
   *  story. A pager has to say which face it is on and how many there are,
   *  and that sentence cannot be derived from `label` alone. Ignored on a
   *  card with no `onPress`, which is not a control and has no name to give. */
  pressLabel?: string;
  children: ReactNode;
}) {
  const interactive = typeof onPress === "function";
  const hasReading = typeof reading === "string" && reading.trim().length > 0;

  const body = (
    <>
      <div
        data-face
        style={{ width: CARD_FACE, height: CARD_FACE }}
        className="grid aspect-square place-items-center overflow-hidden rounded-[var(--radius-tile)] bg-surface-2"
      >
        {children}
      </div>
      {/* Fixed height plus a truncated label: two cards with a one-word and a
          run-on label must still end up the same height, or the "one shape
          for every instrument" promise breaks the moment real copy arrives. */}
      <div data-label-row className="mt-2.5 flex h-5 items-center gap-2">
        <span
          data-label
          className="min-w-0 flex-1 truncate font-mono text-2xs uppercase tracking-wider text-ink-3"
        >
          {label}
        </span>
        {/* Capped and truncated, because one of these readings is a track
            title and a title is as long as whoever named it. An uncapped
            value pushes the label out of its own card, which is the shared
            shell breaking on real data. */}
        <span className="min-w-0 max-w-[62%] shrink-0 truncate font-mono text-2xs tabular-nums text-ink-2">
          {hasReading ? reading : "—"}
        </span>
      </div>
    </>
  );

  /* "If it looks like a card, it lifts" — the design language's second law, and
     the only motion here: it happens because the pointer arrived, not on its
     own. A card with one face is not a control and does not pretend to be. */
  const lift =
    "block w-full text-left transition-transform duration-200 ease-out hover:-translate-y-0.5";

  if (!interactive) return <div data-card className={lift}>{body}</div>;

  return (
    <button
      type="button"
      data-card
      onClick={onPress}
      /* The face's children plus the label and reading would otherwise
         concatenate into whatever the face happens to render — a jumble, not
         a name. Say what pressing the button does instead. */
      aria-label={pressLabel ?? `Turn the ${label} card to its other face`}
      className={`${lift} min-h-[2.75rem] cursor-pointer`}
    >
      {body}
    </button>
  );
}
