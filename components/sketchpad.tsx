"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GlyphCell } from "@/components/glyph-cell";
import {
  PAD_CELLS,
  PAD_GRID,
  SIGNATURE_MAX,
  encodeCells,
  padFrame,
} from "@/lib/pad-field";

/** Canvas units. The field is scaled to the column by CSS, as every field is. */
const SIZE = 288;

type Sending = "idle" | "sending" | "sent" | "full" | "failed";

/** What the pad says about itself, under the field, in one line.

    Idle is missing on purpose: at rest the line is a readout of the field
    rather than an instruction, in the same voice the rest of the page reports
    in. An instruction there would be repeating the note above the pad. */
const SAID: Record<Exclude<Sending, "idle">, string> = {
  sending: "Adding",
  sent: "Added to the register",
  full: "That is enough for now — try again in ten minutes",
  failed: "It did not go in. Try again",
};

/**
 * A dot-matrix sketchpad, drawn on the site's own field.
 *
 * The colophon spends the whole page arguing that the dot field is the
 * language, and then shows it doing five things nobody can join in with. This
 * is the field handed over: twelve by twelve, the same engine, the same
 * lattice, and whatever you put on it goes on the wall underneath.
 *
 * It is `GlyphCell` that draws it. The pad owns the cells and the pointer
 * arithmetic and hands down a frame; the engine owns the canvas, the skin, and
 * the physics — including the ring struck under a press, which is the whole of
 * this page's answer to Law 4. Nothing here loops. The field moves while a
 * finger is on it and is a still picture the moment one is not.
 *
 * A drag paints rather than toggles. The first cell decides which: pressing on
 * an unlit cell turns cells on for the rest of the gesture, pressing on a lit
 * one rubs them out. Toggling every cell a drag crossed reads as noise the
 * moment the gesture doubles back over itself, which on a 12-cell field it
 * always does.
 */
export function Sketchpad() {
  const router = useRouter();
  const [cells, setCells] = useState<boolean[]>(() => new Array<boolean>(PAD_CELLS).fill(false));
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [signature, setSignature] = useState("");
  const [sending, setSending] = useState<Sending>("idle");

  /* What the gesture in progress is painting, or null between gestures. A ref
     rather than state: it is read inside a pointer handler on the same tick it
     is written, and a re-render per cell crossed would be a render per frame. */
  const paintRef = useRef<boolean | null>(null);

  const frame = useMemo(() => padFrame(cells), [cells]);
  const lit = useMemo(() => cells.reduce((count, on) => count + (on ? 1 : 0), 0), [cells]);
  const drawn = lit > 0;

  const paint = useCallback((index: number, value: boolean) => {
    setCells((was) => {
      if (was[index] === value) return was;
      const next = was.slice();
      next[index] = value;
      return next;
    });
  }, []);

  /* Every gesture is a new submission. Saying "added" over a field the visitor
     has since changed would be the page claiming credit for a drawing nobody
     has sent. */
  const touched = useCallback(() => {
    setSending((was) => (was === "sending" ? was : "idle"));
  }, []);

  /** Which cell the pointer is over, in the field's own coordinates. */
  const cellAt = (event: React.PointerEvent<HTMLElement>): number | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * PAD_GRID);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * PAD_GRID);
    if (column < 0 || column >= PAD_GRID || row < 0 || row >= PAD_GRID) return null;
    return row * PAD_GRID + column;
  };

  const move = (delta: number) => {
    const row = Math.floor(cursor / PAD_GRID);
    const column = cursor % PAD_GRID;
    const next = { row, column };
    if (delta === -PAD_GRID) next.row = Math.max(0, row - 1);
    if (delta === PAD_GRID) next.row = Math.min(PAD_GRID - 1, row + 1);
    if (delta === -1) next.column = Math.max(0, column - 1);
    if (delta === 1) next.column = Math.min(PAD_GRID - 1, column + 1);
    setCursor(next.row * PAD_GRID + next.column);
  };

  const send = async () => {
    if (!drawn || sending === "sending") return;
    setSending("sending");
    try {
      const res = await fetch("/api/pad", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "drawing", cells: encodeCells(cells), signature }),
      });
      if (res.status === 429) {
        setSending("full");
        return;
      }
      if (!res.ok) {
        setSending("failed");
        return;
      }
      setSending("sent");
      /* The register is rendered on the server, so the new drawing arrives the
         way every other fact on this page does — by the page being asked
         again. No second copy of the wall is kept here to be patched. */
      router.refresh();
    } catch {
      setSending("failed");
    }
  };

  const cursorRow = Math.floor(cursor / PAD_GRID);
  const cursorColumn = cursor % PAD_GRID;

  return (
    <div className="space-y-4">
      <div
        role="group"
        tabIndex={0}
        aria-label={`Sketchpad, ${PAD_GRID} by ${PAD_GRID} dots. Drag to draw. Arrow keys move, space toggles a dot.`}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          paintRef.current = null;
        }}
        onKeyDown={(event) => {
          const steps: Record<string, number> = {
            ArrowUp: -PAD_GRID,
            ArrowDown: PAD_GRID,
            ArrowLeft: -1,
            ArrowRight: 1,
          };
          if (event.key in steps) {
            event.preventDefault();
            move(steps[event.key]);
          } else if (event.key === " " || event.key === "Enter") {
            // Space scrolls the page unless it is claimed, and a pad that
            // scrolls the page away while you draw on it is unusable.
            event.preventDefault();
            paint(cursor, !cells[cursor]);
            touched();
          }
        }}
        onPointerDown={(event) => {
          const index = cellAt(event);
          if (index === null) return;
          const value = !cells[index];
          paintRef.current = value;
          setCursor(index);
          paint(index, value);
          touched();
        }}
        onPointerMove={(event) => {
          const value = paintRef.current;
          if (value === null) return;
          const index = cellAt(event);
          if (index !== null) paint(index, value);
        }}
        onPointerUp={() => {
          paintRef.current = null;
        }}
        onPointerCancel={() => {
          paintRef.current = null;
        }}
        onPointerLeave={() => {
          paintRef.current = null;
        }}
        /* The pad keeps the touch. `pan-y` would hand every vertical stroke to
           the scroller, which on a square field is half of what anyone draws.
           The field is capped well inside the column so there is always page
           either side of it to scroll from. */
        style={{ touchAction: "none" }}
        className="inline-block w-full max-w-[17rem] cursor-crosshair select-none"
      >
        <GlyphCell
          grid={PAD_GRID}
          size={SIZE}
          frame={frame}
          polarity="ink"
          label={`Sketchpad, ${lit} of ${PAD_CELLS} dots lit`}
          className="w-full text-ink"
        >
          {/* Where the keyboard is standing. Drawn over the field rather than
              into it, so the cursor is never mistaken for a mark and never
              travels to the register. */}
          {focused && (
            <span
              aria-hidden
              className="absolute border border-ink"
              style={{
                left: `${(cursorColumn / PAD_GRID) * 100}%`,
                top: `${(cursorRow / PAD_GRID) * 100}%`,
                width: `${100 / PAD_GRID}%`,
                height: `${100 / PAD_GRID}%`,
              }}
            />
          )}
        </GlyphCell>
        {/* The canvas cannot be read, so the cursor says where it is out loud.
            Polite, so it waits for a pause rather than interrupting a run of
            arrow presses. */}
        <span aria-live="polite" className="sr-only">
          {focused
            ? `Row ${cursorRow + 1}, column ${cursorColumn + 1}, ${cells[cursor] ? "on" : "off"}`
            : ""}
        </span>
      </div>

      {/* The controls take the pad's own width and no more, so the block under
          the field reads as belonging to it. The signature gets its own line
          rather than a share of one: three controls abreast in 17rem left it
          44px wide, which is a field you cannot read your own name in. */}
      <div className="w-full max-w-[17rem] space-y-2">
        <label className="flex items-center gap-2 rounded-full border border-line px-4 py-2 transition-colors focus-within:border-ink-3">
          <span className="shrink-0 font-mono text-2xs uppercase tracking-wider text-ink-3">
            Sign
          </span>
          <input
            type="text"
            value={signature}
            /* A courtesy, not the control. The cap that counts is the one on
               the server, which this endpoint can be reached without. */
            maxLength={SIGNATURE_MAX}
            placeholder="optional"
            onChange={(event) => {
              setSignature(event.target.value);
              touched();
            }}
            className="w-full min-w-0 bg-transparent font-mono text-xs text-ink outline-none placeholder:text-ink-3"
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCells(new Array<boolean>(PAD_CELLS).fill(false));
              touched();
            }}
            disabled={!drawn}
            className="rounded-full border border-line px-4 py-2 font-mono text-2xs uppercase tracking-wider text-ink-2 transition-colors hover:border-ink-3 disabled:opacity-40"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={send}
            disabled={!drawn || sending === "sending"}
            className="flex-1 rounded-full bg-strong px-4 py-2 font-mono text-2xs uppercase tracking-wider text-on-strong transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            Add it
          </button>
        </div>

          <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">
          {sending === "idle" ? `${lit} of ${PAD_CELLS} lit` : SAID[sending]}
        </p>
      </div>
    </div>
  );
}
