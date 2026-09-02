// components/instrument-card.tsx
import type { ReactNode } from "react";

/**
 * The measure every face is drawn at. One number, because the defect this
 * component exists to fix was four instruments at four sizes — a large disc, a
 * medium card, a small clock — with no shared baseline between them.
 */
export const CARD_FACE = 96;

/**
 * One instrument, in the shape every instrument takes.
 *
 * The card owns footprint, radius, padding and where the label sits; the face
 * inside owns only what it reads. That division is the whole argument: a bank
 * of readings rather than a collection of widgets.
 *
 * `reading` absent is not the same as empty. A card with nothing to say prints
 * an em dash and keeps its label, because an instrument that cannot read must
 * say so — a blank card reads as broken, and a stale one lies.
 */
export function InstrumentCard({
  label,
  reading,
  interactive = false,
  onPress,
  children,
}: {
  label: string;
  /** The value, if there is one. Absent renders the unreported dash. */
  reading?: string;
  /** True only when the card has a second face to turn to. */
  interactive?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  const body = (
    <>
      <div
        data-face
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--radius-tile)] bg-surface-2"
      >
        {children}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-ink-3">{label}</span>
        <span className="font-mono text-2xs tabular-nums text-ink-2">{reading ?? "—"}</span>
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
      className={`${lift} min-h-[2.75rem] cursor-pointer`}
    >
      {body}
    </button>
  );
}
