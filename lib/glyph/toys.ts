/**
 * Glyph Toys: the little machines the field can be, when it has nothing to report.
 *
 * Phone (3) puts 489 LEDs on its back and then — instead of a battery bar and
 * nothing else — gives you a Magic 8 Ball, a bottle to spin, and a hand to
 * throw. That is the argument this whole language rests on: an instrument you
 * can operate is worth more than a readout you can only look at.
 *
 * Everything here is pure. A toy is a function from its own state to a field,
 * and the state is small enough to keep in one object — which is what lets the
 * component own the clock and the input and nothing else.
 */
import { stampText, textWidth } from "@/lib/glyph/font";
import { emptyFrame } from "@/lib/glyph/glyphs";

export const TOYS = ["8 ball", "bottle", "throw", "dice", "snake"] as const;
export type Toy = (typeof TOYS)[number];

/* ── The 8 ball ───────────────────────────────────────────────────────────── */

/** Short enough to set in a 3x5 alphabet across a disc. */
export const ANSWERS = [
  "YES",
  "NO",
  "MAYBE",
  "ASK AGAIN",
  "SURE",
  "DOUBT IT",
  "NOT NOW",
  "LATER",
] as const;

/** Which answer a shake lands on. Kept pure so a test can pin the throw. */
export function answerFor(roll: number): string {
  const i = Math.floor(roll * ANSWERS.length);
  return ANSWERS[Math.min(ANSWERS.length - 1, Math.max(0, i))];
}

/* ── Dice ─────────────────────────────────────────────────────────────────── */

/** Pip layout on a 3x3, as a die actually reads. */
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** A die face as a field: pips as blocks, so they read at any size. */
export function diceFrame(grid: number, value: number): Float32Array {
  const frame = emptyFrame(grid);
  const pips = PIPS[Math.min(6, Math.max(1, Math.round(value)))] ?? PIPS[1];
  const block = Math.max(2, Math.round(grid * 0.14));
  const gap = Math.round(grid * 0.09);
  const span = block * 3 + gap * 2;
  const origin = Math.round((grid - span) / 2);

  for (const [col, row] of pips) {
    const x0 = origin + col * (block + gap);
    const y0 = origin + row * (block + gap);
    for (let y = y0; y < y0 + block; y++) {
      for (let x = x0; x < x0 + block; x++) {
        if (x >= 0 && x < grid && y >= 0 && y < grid) frame[y * grid + x] = 1;
      }
    }
  }
  return frame;
}

/* ── Snake ────────────────────────────────────────────────────────────────── */

export type Point = { x: number; y: number };
export type SnakeState = {
  body: Point[]; // head first
  dir: Point;
  food: Point;
  dead: boolean;
  score: number;
};

/** The board is smaller than the field so the snake has a visible margin. */
export const SNAKE_BOARD = 13;

export function newSnake(seed = 0.5): SnakeState {
  const mid = Math.floor(SNAKE_BOARD / 2);
  const body = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return { body, dir: { x: 1, y: 0 }, food: placeFood(body, seed), dead: false, score: 0 };
}

/** Somewhere the snake is not. Deterministic in `roll` so a test can pin it. */
export function placeFood(body: Point[], roll: number): Point {
  const free: Point[] = [];
  for (let y = 0; y < SNAKE_BOARD; y++) {
    for (let x = 0; x < SNAKE_BOARD; x++) {
      if (!body.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return body[0];
  return free[Math.min(free.length - 1, Math.floor(roll * free.length))];
}

/** A turn is refused if it would double the snake back into its own neck. */
export function steer(state: SnakeState, dir: Point): SnakeState {
  if (state.dir.x === -dir.x && state.dir.y === -dir.y) return state;
  if (state.dir.x === dir.x && state.dir.y === dir.y) return state;
  return { ...state, dir };
}

export function stepSnake(state: SnakeState, roll: number): SnakeState {
  if (state.dead) return state;
  const head = state.body[0];
  const next = { x: head.x + state.dir.x, y: head.y + state.dir.y };

  // The wall is the end of it. Wrapping would make the board meaningless.
  if (next.x < 0 || next.x >= SNAKE_BOARD || next.y < 0 || next.y >= SNAKE_BOARD) {
    return { ...state, dead: true };
  }
  // The tail tip moves out of the way on the same tick, so following it is legal.
  const willGrow = next.x === state.food.x && next.y === state.food.y;
  const occupied = willGrow ? state.body : state.body.slice(0, -1);
  if (occupied.some((p) => p.x === next.x && p.y === next.y)) {
    return { ...state, dead: true };
  }

  const body = [next, ...(willGrow ? state.body : state.body.slice(0, -1))];
  return {
    body,
    dir: state.dir,
    food: willGrow ? placeFood(body, roll) : state.food,
    dead: false,
    score: state.score + (willGrow ? 1 : 0),
  };
}

export function snakeFrame(grid: number, state: SnakeState): Float32Array {
  const frame = emptyFrame(grid);
  const inset = Math.floor((grid - SNAKE_BOARD) / 2);
  const put = (p: Point, v: number) => {
    const x = inset + p.x;
    const y = inset + p.y;
    if (x >= 0 && x < grid && y >= 0 && y < grid) frame[y * grid + x] = v;
  };
  // The food blinks by sitting at a lower value; the head leads at full.
  put(state.food, 0.55);
  state.body.forEach((p, i) => put(p, i === 0 ? 1 : 0.8));
  return frame;
}

/**
 * The 8 ball at rest: a filled disc with the numeral knocked out of it.
 *
 * The reference draws it as a solid ball rather than a lone digit, and that is
 * the difference between a toy and a label. The numeral is punched out rather
 * than laid on top, so the ball reads as an object with a mark on it.
 */
export function eightBallFrame(grid: number): Float32Array {
  const frame = emptyFrame(grid);
  const c = (grid - 1) / 2;
  const r = grid * 0.36;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (Math.hypot(x - c, y - c) <= r) frame[y * grid + x] = 1;
    }
  }

  const cut = emptyFrame(grid);
  const w = textWidth("8");
  stampText(cut, grid, "8", Math.round((grid - w) / 2), Math.round(c) - 2);
  for (let i = 0; i < frame.length; i++) if (cut[i] > 0) frame[i] = 0;
  return frame;
}

/* ── Spin the bottle ──────────────────────────────────────────────────────── */

/** A needle from the middle of the field, pointing at `angle` radians. */
export function bottleFrame(grid: number, angle: number): Float32Array {
  const frame = emptyFrame(grid);
  const c = (grid - 1) / 2;
  const reach = c - 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const put = (x: number, y: number, v: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || xi >= grid || yi < 0 || yi >= grid) return;
    frame[yi * grid + xi] = Math.max(frame[yi * grid + xi], v);
  };

  // The neck, out to the tip.
  for (let t = 0; t <= reach; t += 0.4) put(c + dx * t, c + dy * t, 1);
  // And a stubby base behind the middle, so it reads as a bottle and not a hand.
  for (let t = -4; t <= 0; t += 0.4) {
    put(c + dx * t, c + dy * t, 1);
    put(c + dx * t - dy, c + dy * t + dx, 1);
    put(c + dx * t + dy, c + dy * t - dx, 1);
  }
  return frame;
}

/* ── Rock, paper, scissors ────────────────────────────────────────────────── */

export const HANDS = ["rock", "paper", "scissors"] as const;
export type Hand = (typeof HANDS)[number];

export function handFrame(grid: number, hand: Hand): Float32Array {
  const frame = emptyFrame(grid);
  const c = (grid - 1) / 2;
  const put = (x: number, y: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi >= 0 && xi < grid && yi >= 0 && yi < grid) frame[yi * grid + xi] = 1;
  };

  if (hand === "rock") {
    const r = grid * 0.28;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) if (Math.hypot(x, y) <= r) put(c + x, c + y);
    }
  } else if (hand === "paper") {
    const w = Math.round(grid * 0.26);
    const h = Math.round(grid * 0.32);
    for (let y = -h; y <= h; y++) for (let x = -w; x <= w; x++) put(c + x, c + y);
  } else {
    // Two blades crossing, open at the top, as a pair of scissors reads.
    const reach = grid * 0.3;
    for (let t = -reach; t <= reach; t += 0.4) {
      put(c + t * 0.62, c + t);
      put(c - t * 0.62, c + t);
    }
  }
  return frame;
}

/** Who won, from the thrower's side. */
export function beats(mine: Hand, theirs: Hand): "win" | "lose" | "draw" {
  if (mine === theirs) return "draw";
  const wins: Record<Hand, Hand> = { rock: "scissors", paper: "rock", scissors: "paper" };
  return wins[mine] === theirs ? "win" : "lose";
}

/* ── Type across the field ────────────────────────────────────────────────── */

/** Centre a line of the dot alphabet, or return null if it cannot fit. */
export function centreText(grid: number, text: string, row: number): Float32Array | null {
  const width = textWidth(text);
  if (width > grid) return null;
  const frame = emptyFrame(grid);
  stampText(frame, grid, text, Math.round((grid - width) / 2), row);
  return frame;
}

/**
 * Set a phrase across the field, breaking it into lines that fit.
 *
 * Words are kept whole. A phrase that cannot be made to fit returns null rather
 * than being clipped, so a caller finds out at build time and not the visitor
 * at read time.
 */
export function textFrame(grid: number, phrase: string): Float32Array | null {
  const words = phrase.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate) <= grid - 2) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      if (textWidth(word) > grid - 2) return null;
      line = word;
    }
  }
  if (line) lines.push(line);

  const LINE_H = 7; // 5 tall plus two of leading
  const block = lines.length * LINE_H - 2;
  let top = Math.round((grid - block) / 2);
  if (top < 0) return null;

  const frame = emptyFrame(grid);
  for (const text of lines) {
    stampText(frame, grid, text, Math.round((grid - textWidth(text)) / 2), top);
    top += LINE_H;
  }
  return frame;
}
