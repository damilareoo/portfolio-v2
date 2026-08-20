"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlyphCell } from "@/components/glyph-cell";
import { emptyFrame } from "@/lib/glyph/glyphs";
import {
  HANDS,
  TOYS,
  answerFor,
  bottleFrame,
  diceFrame,
  eightBallFrame,
  handFrame,
  newSnake,
  snakeFrame,
  steer,
  stepSnake,
  textFrame,
  type Hand,
  type SnakeState,
  type Toy,
} from "@/lib/glyph/toys";

const GRID = 25;
const SIZE = 300; // canvas units; CSS scales it

/** What each toy is called, and what the button does to it. */
const CAPTIONS: Record<Toy, string> = {
  "8 ball": "Hold to ask",
  bottle: "Hold to spin",
  throw: "Hold to throw",
  dice: "Hold to roll",
  snake: "Hold to play",
};

type Phase = "idle" | "working" | "result";

/**
 * The toys, as the phone has them.
 *
 * Phone (3) puts 489 LEDs on its back and then hands you a Magic 8 Ball and a
 * bottle to spin, operated by one button: press to cycle, press and hold to
 * act. That is the whole interaction model, and it is copied here exactly —
 * the constraint is the design, and giving the field five buttons instead of
 * one would lose the thing worth borrowing.
 *
 * Nothing here reports anything. It is the one field on the site with no source
 * but the person looking at it, which is the argument the colophon is making.
 */
export function GlyphToys() {
  const [toy, setToy] = useState<Toy>("8 ball");
  const [phase, setPhase] = useState<Phase>("idle");
  const [frame, setFrame] = useState<Float32Array>(() => idleFrame("8 ball"));
  const [caption, setCaption] = useState("");
  const [score, setScore] = useState(0);

  const rafRef = useRef(0);
  const snakeRef = useRef<SnakeState | null>(null);
  const holdRef = useRef<number | null>(null);
  const heldRef = useRef(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  /* Nothing is left running when you leave. A toy that kept going would be the
     one thing on this page moving while nobody is touching it. */
  useEffect(() => stop, [stop]);

  /* Turning to a toy is what resets it, so the reset lives with the turn rather
     than in an effect watching for it — there is no state here derived from
     anything but the press that changed it. */
  const show = useCallback(
    (next: Toy) => {
      stop();
      snakeRef.current = null;
      setToy(next);
      setPhase("idle");
      setScore(0);
      setCaption("");
      setFrame(idleFrame(next));
    },
    [stop],
  );

  /* Read the current toy rather than reaching for it through an updater. An
     updater has to be pure, and `show` sets state — nesting them queued the
     turn twice and skipped a toy every press. */
  const cycle = useCallback(() => {
    show(TOYS[(TOYS.indexOf(toy) + 1) % TOYS.length]);
  }, [toy, show]);

  /* ── the toys ─────────────────────────────────────────────────────────── */

  const runSpin = useCallback(() => {
    setPhase("working");
    const spins = 4 + Math.random() * 3;
    const target = Math.random() * Math.PI * 2;
    const total = spins * Math.PI * 2 + target;
    const DURATION = 2600;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // Out-quint: a bottle loses its spin slowly and then all at once.
      const angle = total * (1 - Math.pow(1 - t, 5));
      setFrame(bottleFrame(GRID, angle));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setPhase("result");
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const runShake = useCallback(() => {
    setPhase("working");
    const answer = answerFor(Math.random());
    const DURATION = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      if (t < 1) {
        // Static, thinning out — the ball clouding over before it answers.
        const density = 0.34 * (1 - t);
        const noise = emptyFrame(GRID);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.random() < density ? 1 : 0;
        setFrame(noise);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFrame(textFrame(GRID, answer) ?? emptyFrame(GRID));
        setCaption(answer.toLowerCase());
        setPhase("result");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const runRoll = useCallback(() => {
    setPhase("working");
    const landed = 1 + Math.floor(Math.random() * 6);
    const DURATION = 1200;
    const start = performance.now();
    let last = -1;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      if (t < 1) {
        // Tumbling slows as it settles: faces change less and less often.
        const gap = 60 + t * 220;
        if (now - last > gap) {
          last = now;
          setFrame(diceFrame(GRID, 1 + Math.floor(Math.random() * 6)));
        }
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFrame(diceFrame(GRID, landed));
        setCaption(`${landed}`);
        setPhase("result");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const runThrow = useCallback(() => {
    setPhase("working");
    const mine: Hand = HANDS[Math.floor(Math.random() * HANDS.length)];
    const DURATION = 1100;
    const start = performance.now();
    let last = -1;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      if (t < 1) {
        if (now - last > 110) {
          last = now;
          setFrame(handFrame(GRID, HANDS[Math.floor(Math.random() * HANDS.length)]));
        }
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFrame(handFrame(GRID, mine));
        setCaption(mine);
        setPhase("result");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const runSnake = useCallback(() => {
    setPhase("working");
    const state = newSnake(Math.random());
    snakeRef.current = state;
    setFrame(snakeFrame(GRID, state));
    setScore(0);

    let last = performance.now();
    const tick = (now: number) => {
      const current = snakeRef.current;
      if (!current) return;
      // A step every 190ms: fast enough to be a game, slow enough to steer.
      if (now - last >= 190) {
        last = now;
        const next = stepSnake(current, Math.random());
        snakeRef.current = next;
        setFrame(snakeFrame(GRID, next));
        setScore(next.score);
        if (next.dead) {
          setCaption(`${next.score}`);
          setPhase("result");
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const activate = useCallback(() => {
    stop();
    setCaption("");
    if (toy === "8 ball") runShake();
    else if (toy === "bottle") runSpin();
    else if (toy === "dice") runRoll();
    else if (toy === "throw") runThrow();
    else runSnake();
  }, [toy, stop, runShake, runSpin, runRoll, runThrow, runSnake]);

  /* ── the one button ───────────────────────────────────────────────────── */

  const HOLD_MS = 320;

  const press = () => {
    heldRef.current = false;
    holdRef.current = window.setTimeout(() => {
      heldRef.current = true;
      activate();
    }, HOLD_MS);
  };

  const release = () => {
    if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    holdRef.current = null;
    // A press that was not a hold turns to the next toy, as the phone does.
    if (!heldRef.current) cycle();
    heldRef.current = false;
  };

  const nudge = (x: number, y: number) => {
    const current = snakeRef.current;
    if (!current || current.dead) return;
    snakeRef.current = steer(current, { x, y });
  };

  const said =
    phase === "working"
      ? "working"
      : caption
        ? caption
        : CAPTIONS[toy];

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={`Glyph toys. Showing ${toy}. ${CAPTIONS[toy]}. Press the button to change toy, hold it to start.`}
        tabIndex={0}
        onKeyDown={(event) => {
          const arrows: Record<string, [number, number]> = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
          };
          const dir = arrows[event.key];
          if (dir && snakeRef.current) {
            event.preventDefault();
            nudge(dir[0], dir[1]);
          } else if (event.key === "Enter") {
            event.preventDefault();
            cycle();
          } else if (event.key === " ") {
            event.preventDefault();
            activate();
          }
        }}
        className="inline-block"
      >
        <GlyphCell
          grid={GRID}
          size={SIZE}
          shape="circle"
          frame={frame}
          polarity="ink"
          label={`${toy}: ${said}`}
          className="w-[200px] max-w-full text-ink select-none"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* One button, as the phone has. Press cycles, hold acts. */}
        <button
          type="button"
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={() => {
            if (holdRef.current !== null) window.clearTimeout(holdRef.current);
            holdRef.current = null;
          }}
          aria-label={`Glyph button. Press to change toy, hold to start ${toy}.`}
          className="h-7 w-7 rounded-full border border-line transition-colors hover:border-ink-3 active:bg-surface-2"
        />
        <div className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          <span className="text-ink-2">{toy}</span>
          <span> · {said}</span>
          {toy === "snake" && phase === "working" ? <span> · {score}</span> : null}
        </div>
      </div>

      {toy === "snake" ? (
        <p className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
          Arrow keys to steer
        </p>
      ) : null}
    </div>
  );
}

/** What a toy looks like sitting still, before anybody asks it anything. */
function idleFrame(toy: Toy): Float32Array {
  if (toy === "bottle") return bottleFrame(GRID, -Math.PI / 2);
  if (toy === "dice") return diceFrame(GRID, 6);
  if (toy === "throw") return handFrame(GRID, "rock");
  if (toy === "snake") return snakeFrame(GRID, newSnake(0.5));
  return eightBallFrame(GRID);
}
