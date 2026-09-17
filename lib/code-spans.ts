/**
 * Backticks, in the one place on this site that writes them.
 *
 * The changelog is written the way the commits are written, and the commits
 * name files, tokens and CSS properties in backticks — `unsharp`,
 * `overflow-hidden`, `--pixel-floor`. Rendered as a plain string the ticks came
 * out as ticks: thirty-five entries of prose with punctuation in it that meant
 * nothing to a reader and looked like a mistake to anyone who knows what it
 * usually means.
 *
 * This is not a markdown parser and must not become one. Notes are authored by
 * one person in one file and the only markup any of them has ever used is a
 * code span. Everything else in `data/changelog.ts` — em dashes, quotes,
 * figures — is already the character it should be.
 *
 * A tick that is never closed stays a tick. An entry mid-edit should read as
 * the sentence it is rather than lose its tail into a code span that runs to
 * the end of the note.
 */
export type Span = { text: string; code: boolean };

export function splitTicks(source: string): Span[] {
  const parts = source.split("`");
  const spans: Span[] = [];

  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1;
    /* Odd segments sit between two ticks — unless the segment is the last one,
       which means its opening tick was never closed. Then it is prose, and it
       gets the tick it was written with put back in front of it. */
    const opened = i % 2 === 1;
    const code = opened && !last;
    const text = opened && last ? `\`${parts[i]}` : parts[i];
    if (text.length > 0) spans.push({ text, code });
  }

  return spans;
}
