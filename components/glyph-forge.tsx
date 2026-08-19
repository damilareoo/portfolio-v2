"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { authoredGlyph } from "@/data/glyph";
import { sweepMask } from "@/lib/glyph/entrance";
import {
  COUNTED_KEY,
  GRID,
  STORAGE_KEY,
  encodeGlyph,
  glyphFrame,
} from "@/lib/glyph/forge";
import { useStoredGlyph } from "@/lib/glyph/stored-glyph";

const CELLS = GRID * GRID;
const SIZE = 300; // canvas units; CSS scales it

/**
 * What the forge opens holding when this browser has drawn nothing.
 *
 * Not a blank field. A blank one is a faint lattice and an invitation nobody
 * reads — it looks like the page failed rather than like something to draw on
 * — and it leaves Clear and Reset doing the same nothing. Opening on the mark
 * gives the visitor a drawing to take apart, which is a better first move than
 * a square of almost nothing, and it is what Reset puts back.
 *
 * Shared and never written to; every edit copies before it changes anything.
 */
const AUTHORED = Uint8Array.from(authoredGlyph);

const BLANK = new Uint8Array(CELLS);

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

function Control({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-line px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      {children}
    </button>
  );
}

/**
 * The forge: the same field the home carries, with the visitor holding the pen.
 *
 * Everything else on the site draws its own dots from something real — a track,
 * a step count, a mark. This one has no source but the person looking at it,
 * which is the argument the colophon is making: the instrument is not a picture
 * of an instrument, and here is the proof, because you can drive it.
 *
 * The drawing never leaves the browser. What is sent is one bare fact, once —
 * that a glyph was drawn at all — because a shared number is only worth having
 * if it costs the person nothing to be counted in it.
 */
export function GlyphForge() {
  const stored = useStoredGlyph();

  /* What this session has drawn, or null while it has drawn nothing — which is
     what lets a stored drawing show through without being copied into state
     first, and lets another tab's drawing arrive while this one sits idle. */
  const [draft, setDraft] = useState<Uint8Array | null>(null);
  const cells = draft ?? stored ?? AUTHORED;

  const [caret, setCaret] = useState(Math.floor(CELLS / 2));
  const [showCaret, setShowCaret] = useState(false);
  const [scrub, setScrub] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const fieldRef = useRef<HTMLDivElement | null>(null);
  /* Which way the current stroke is painting. Decided by the cell it started
     on — press on ink to erase, press on ground to draw — so one gesture does
     one thing for its whole length, rather than flickering under the finger. */
  const strokeRef = useRef<0 | 1>(1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/glyphs-drawn")
      .then((r) => r.json())
      .then((d: { count: number | null; live: boolean }) => {
        if (cancelled) return;
        setTotal(d.count);
        setLive(Boolean(d.live));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Save, and — the first time this browser ever does — say so.
   *
   * The flag is written before the request rather than after it: a counter that
   * missed a visitor is a wrong number, and a counter that counted one visitor
   * twice because the network was slow is a broken one.
   */
  const save = useCallback((next: Uint8Array) => {
    try {
      localStorage.setItem(STORAGE_KEY, encodeGlyph(next));
      if (localStorage.getItem(COUNTED_KEY)) return;
      localStorage.setItem(COUNTED_KEY, "1");
    } catch {
      return; // No storage, no drawing kept, and nothing to announce.
    }
    fetch("/api/glyphs-drawn", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count: number | null; live: boolean }) => {
        setTotal(d.count);
        setLive(Boolean(d.live));
      })
      .catch(() => {});
  }, []);

  const edit = useCallback(
    (next: Uint8Array) => {
      setDraft(next);
      setScrub(1); // A drawing half-hidden behind a preview reads as a bug.
      save(next);
    },
    [save],
  );

  const paint = useCallback(
    (index: number, value: 0 | 1) => {
      if (cells[index] === value) return; // Nothing to say.
      const next = Uint8Array.from(cells);
      next[index] = value;
      edit(next);
    },
    [cells, edit],
  );

  /** Which cell a point on the field stands on, or null if it stands off it. */
  const cellAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      const col = Math.floor(((clientX - rect.left) / rect.width) * GRID);
      const row = Math.floor(((clientY - rect.top) / rect.height) * GRID);
      if (col < 0 || col >= GRID || row < 0 || row >= GRID) return null;
      return row * GRID + col;
    },
    [],
  );

  const frame = useMemo(() => {
    const field = glyphFrame(cells);
    if (scrub >= 1) return field;
    const mask = sweepMask(GRID, scrub);
    const previewed = new Float32Array(CELLS);
    for (let i = 0; i < CELLS; i++) previewed[i] = field[i] * mask[i];
    return previewed;
  }, [cells, scrub]);

  const lit = useMemo(
    () => cells.reduce((n, cell) => n + (cell ? 1 : 0), 0),
    [cells],
  );
  const caretCol = caret % GRID;
  const caretRow = Math.floor(caret / GRID);

  const moveCaret = (dc: number, dr: number) => {
    const col = Math.min(GRID - 1, Math.max(0, caretCol + dc));
    const row = Math.min(GRID - 1, Math.max(0, caretRow + dr));
    setCaret(row * GRID + col);
    setShowCaret(true);
  };

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={`A ${GRID} by ${GRID} field to draw on, ${lit} of ${CELLS} dots lit. Drag across it to draw, or use the arrow keys to move the caret and space to turn a dot on and off.`}
        tabIndex={0}
        /* A drag on this field draws; it does not scroll the page under it.
           The field is a fixed square, so what is given up is scrolling from
           inside one small box, and what is bought is the whole interaction. */
        style={{ touchAction: "none" }}
        onFocus={() => setShowCaret(true)}
        onBlur={() => setShowCaret(false)}
        onKeyDown={(event) => {
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          };
          const move = moves[event.key];
          if (move) {
            event.preventDefault();
            moveCaret(move[0], move[1]);
          } else if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            setShowCaret(true);
            paint(caret, cells[caret] ? 0 : 1);
          }
        }}
        onPointerDown={(event) => {
          const index = cellAt(event.clientX, event.clientY);
          if (index === null) return;
          strokeRef.current = cells[index] ? 0 : 1;
          /* Capture, so a stroke that runs off the edge and comes back is one
             stroke. It also takes the move events away from the field beneath,
             which is why drawing does not shove the dots around as it goes. */
          event.currentTarget.setPointerCapture(event.pointerId);
          setShowCaret(false);
          setCaret(index);
          paint(index, strokeRef.current);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const index = cellAt(event.clientX, event.clientY);
          if (index !== null) paint(index, strokeRef.current);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        className="inline-block cursor-crosshair border border-line p-2"
      >
        {/* The measured box is the canvas itself, inside the padding: the
            handlers want an edge to press on, `cellAt` wants the field. */}
        <div ref={fieldRef} className="leading-[0]">
          <GlyphCell
            grid={GRID}
            size={SIZE}
            frame={frame}
            polarity="ink"
            label={`Your glyph: ${lit} of ${CELLS} dots lit.`}
            className="w-[260px] max-w-full text-ink select-none"
          >
            {showCaret ? (
              <svg
                viewBox="0 0 100 100"
                aria-hidden
                className="absolute inset-0 h-full w-full"
              >
                <rect
                  x={(caretCol / GRID) * 100}
                  y={(caretRow / GRID) * 100}
                  width={100 / GRID}
                  height={100 / GRID}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.7}
                  opacity={0.75}
                />
              </svg>
            ) : null}
          </GlyphCell>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Control
          onClick={() => {
            edit(Uint8Array.from(BLANK));
            setShowCaret(false);
          }}
        >
          Clear
        </Control>
        <Control
          onClick={() => {
            edit(Uint8Array.from(AUTHORED));
            setShowCaret(false);
          }}
        >
          Reset
        </Control>
        <label className="ml-1 flex items-center gap-2">
          <Label>Arrival</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={scrub}
            onChange={(event) => setScrub(Number(event.target.value))}
            aria-label="Preview the arrival sweep across your glyph"
            className="h-1 w-24 accent-current text-ink-2"
          />
        </label>
      </div>

      <div className="border-t border-line pt-3">
        <Label>Glyphs drawn</Label>
        <div className="mt-1.5">
          {live && total !== null ? (
            <span className="font-mono text-[1.25rem] tabular-nums">
              {total.toLocaleString("en-US")}
            </span>
          ) : (
            <span className="font-mono text-[1.25rem] text-ink-3">––––</span>
          )}
        </div>
      </div>
    </div>
  );
}
