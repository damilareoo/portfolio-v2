// components/instrument-card.tsx
import type { ReactNode } from "react";

/**
 * One reading, in the shape every reading takes.
 *
 * The shell owns radius, the value's row and where it sits; the face inside
 * owns only what it reads. That division is the whole argument: a wall of
 * readings rather than a collection of widgets. There is no padding here —
 * the face sits flush to the shell's own edge — so this shell claims none.
 *
 * There is no visible label any more, and no `CARD_FACE` either. Both were
 * answers to a card of a fixed size standing in a row of four. A clock looks
 * like a clock and a disc of album art looks like album art; the word above it
 * repeated the picture, and four repeated words across a wall read as noise
 * rather than as instrumentation. The value takes the label's place beneath
 * the face and becomes the sole identifier. The name itself is not lost — it
 * moves to `srLabel` and is rendered `sr-only`, because removing a visible
 * label must not remove the accessible one.
 *
 * The face is `aspect-square w-full`: it takes whatever the cell gives it.
 * Pinning it to one number was right while every reading stood in an equal
 * cell of a four-column grid, and is wrong the moment the cells differ — a
 * 96px disc stranded in the middle of a wide cell is the defect that replaced.
 *
 * `value` absent, empty or whitespace-only are all treated as "nothing to
 * report": the reading prints an em dash rather than going blank, because an
 * instrument that cannot read must say so — a blank reading looks broken, and
 * a stale one lies.
 *
 * There is no `interactive` prop. Whether the reading is a control is derived
 * from whether `onPress` was given, because a boolean that can disagree with
 * the handler is exactly how a dead button gets built by accident — "a
 * control that does nothing is a lie told with a cursor" should be
 * impossible to construct, not just discouraged in a comment.
 */
export function InstrumentReading({
  srLabel,
  value,
  onPress,
  pressLabel,
  children,
}: {
  /** What this reading is called. Never drawn; only ever spoken. */
  srLabel: string;
  /** The value, if there is one. Absent, empty or blank all render the dash. */
  value?: string;
  /** Present only when the reading has a second face to turn to; its presence
   *  is what makes it a control — see the docblock above. */
  onPress?: () => void;
  /** The button's accessible name, when "turn this over" is not the whole
   *  story. A pager has to say which face it is on and how many there are,
   *  and that sentence cannot be derived from `srLabel` alone. Ignored on a
   *  reading with no `onPress`, which is not a control and has no name to give. */
  pressLabel?: string;
  children: ReactNode;
}) {
  const interactive = typeof onPress === "function";
  const hasValue = typeof value === "string" && value.trim().length > 0;

  const body = (
    <>
      {/* The word the face no longer prints. It leads the reading so a screen
          reader hears what this is before it hears what it says. */}
      <span className="sr-only">{srLabel}</span>
      <div
        data-face
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--radius-tile)] bg-surface-2"
      >
        {children}
      </div>
      {/* Fixed height plus a truncated value: two readings, one printing a time
          and one printing a track title, must still end up the same height, or
          the "one shape for every instrument" promise breaks the moment real
          copy arrives. A title is as long as whoever named it. */}
      <div className="mt-2.5 flex h-5 items-center justify-center">
        <span
          data-value
          className="min-w-0 truncate font-mono text-2xs tabular-nums text-ink-2"
        >
          {hasValue ? value : "—"}
        </span>
      </div>
    </>
  );

  /* "If it looks like a card, it lifts" — the design language's second law, and
     the only motion here: it happens because the pointer arrived, not on its
     own. A reading with one face is not a control and does not pretend to be. */
  const lift =
    "block w-full text-left transition-transform duration-200 ease-out hover:-translate-y-0.5";

  if (!interactive) return <div data-card className={lift}>{body}</div>;

  return (
    <button
      type="button"
      data-card
      onClick={onPress}
      /* The face's children plus the name and the value would otherwise
         concatenate into whatever the face happens to render — a jumble, not
         a name. Say what pressing the button does instead. */
      aria-label={pressLabel ?? `Turn the ${srLabel} reading to its other face`}
      className={`${lift} min-h-[2.75rem] cursor-pointer`}
    >
      {body}
    </button>
  );
}
