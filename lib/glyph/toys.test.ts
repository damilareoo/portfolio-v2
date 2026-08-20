import { describe, expect, it } from "vitest";
import { textWidth } from "./font";
import {
  ANSWERS,
  HANDS,
  beats,
  bottleFrame,
  handFrame,
  SNAKE_BOARD,
  answerFor,
  diceFrame,
  eightBallFrame,
  newSnake,
  placeFood,
  snakeFrame,
  steer,
  stepSnake,
  textFrame,
  type SnakeState,
} from "./toys";

const GRID = 25;
const lit = (frame: Float32Array) => frame.reduce((n, v) => n + (v > 0 ? 1 : 0), 0);

describe("answerFor", () => {
  it("covers every answer across the roll, and never falls off either end", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(answerFor(i / 200));
    expect(seen.size).toBe(ANSWERS.length);
    expect(answerFor(0)).toBe(ANSWERS[0]);
    expect(answerFor(1)).toBe(ANSWERS[ANSWERS.length - 1]);
    expect(answerFor(1.5)).toBe(ANSWERS[ANSWERS.length - 1]);
    expect(answerFor(-1)).toBe(ANSWERS[0]);
  });

  /* Every answer has to fit the field it is set in. A phrase that cannot be
     made to fit is a bug the visitor would find, so the test finds it first. */
  it("only offers answers the field can actually set", () => {
    for (const answer of ANSWERS) {
      expect(textFrame(GRID, answer), answer).not.toBeNull();
      for (const word of answer.split(" ")) expect(textWidth(word)).toBeLessThanOrEqual(GRID - 2);
    }
  });
});

describe("diceFrame", () => {
  it("lights more of the field for a higher face", () => {
    const counts = [1, 2, 3, 4, 5, 6].map((n) => lit(diceFrame(GRID, n)));
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]);
  });

  it("draws pips in proportion — six is six times one", () => {
    expect(lit(diceFrame(GRID, 6))).toBe(lit(diceFrame(GRID, 1)) * 6);
  });

  it("clamps a face that does not exist onto one that does", () => {
    expect(Array.from(diceFrame(GRID, 0))).toEqual(Array.from(diceFrame(GRID, 1)));
    expect(Array.from(diceFrame(GRID, 9))).toEqual(Array.from(diceFrame(GRID, 6)));
  });
});

describe("snake", () => {
  it("starts alive, three long, and heading somewhere", () => {
    const s = newSnake();
    expect(s.body).toHaveLength(3);
    expect(s.dead).toBe(false);
    expect(s.dir).toEqual({ x: 1, y: 0 });
  });

  it("never puts food under the snake", () => {
    const s = newSnake();
    for (let i = 0; i <= 20; i++) {
      const food = placeFood(s.body, i / 20);
      expect(s.body.some((p) => p.x === food.x && p.y === food.y)).toBe(false);
    }
  });

  it("moves the head and drags the tail", () => {
    const s = newSnake();
    const next = stepSnake(s, 0.5);
    expect(next.body[0]).toEqual({ x: s.body[0].x + 1, y: s.body[0].y });
    expect(next.body).toHaveLength(3);
  });

  it("refuses a turn back into its own neck", () => {
    const s = newSnake(); // heading right
    expect(steer(s, { x: -1, y: 0 }).dir).toEqual({ x: 1, y: 0 });
    expect(steer(s, { x: 0, y: 1 }).dir).toEqual({ x: 0, y: 1 });
  });

  it("grows and scores on food, and lays a new one down", () => {
    const s = newSnake();
    const head = s.body[0];
    const fed: SnakeState = { ...s, food: { x: head.x + 1, y: head.y } };
    const next = stepSnake(fed, 0.5);
    expect(next.body).toHaveLength(4);
    expect(next.score).toBe(1);
    expect(next.food).not.toEqual(fed.food);
  });

  it("dies at the wall rather than wrapping — a board with no edge is no board", () => {
    let s = newSnake();
    for (let i = 0; i < SNAKE_BOARD + 2 && !s.dead; i++) s = stepSnake(s, 0.5);
    expect(s.dead).toBe(true);
  });

  it("dies on itself, but may follow the tail tip out of the way", () => {
    const s: SnakeState = {
      body: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
      ],
      dir: { x: 0, y: 1 },
      food: { x: 0, y: 0 },
      dead: false,
      score: 0,
    };
    // Straight down is the tail tip, which moves on this same tick: legal.
    expect(stepSnake(s, 0.5).dead).toBe(false);
    // Into the middle of its own body is not.
    expect(stepSnake({ ...s, dir: { x: -1, y: 0 } }, 0.5).dead).toBe(true);
  });

  it("stops stepping once dead", () => {
    const dead: SnakeState = { ...newSnake(), dead: true };
    expect(stepSnake(dead, 0.5)).toBe(dead);
  });

  it("draws the whole snake and its food, inside the field", () => {
    const s = newSnake();
    expect(lit(snakeFrame(GRID, s))).toBe(s.body.length + 1);
  });
});

describe("textFrame", () => {
  it("sets a phrase and centres it", () => {
    const frame = textFrame(GRID, "YES");
    expect(frame).not.toBeNull();
    expect(lit(frame!)).toBeGreaterThan(0);
  });

  it("breaks onto a second line rather than running off the edge", () => {
    const one = textFrame(GRID, "NOT");
    const two = textFrame(GRID, "NOT NOW");
    expect(lit(two!)).toBeGreaterThan(lit(one!));
  });

  it("refuses a word too wide to set, rather than clipping it", () => {
    expect(textFrame(GRID, "UNCONSCIONABLE")).toBeNull();
  });
});

describe("bottleFrame", () => {
  it("points where it is told", () => {
    const grid = 25;
    const c = (grid - 1) / 2;
    const right = bottleFrame(grid, 0);
    const left = bottleFrame(grid, Math.PI);
    // The tip is lit on the side it points at, and not on the other.
    expect(right[c * grid + (grid - 3)]).toBe(1);
    expect(left[c * grid + 2]).toBe(1);
    expect(right[c * grid + 2]).toBe(0);
  });

  it("lights roughly the same amount whichever way it turns", () => {
    const counts = [0, 1, 2, 3, 4, 5].map((i) => lit(bottleFrame(25, (i * Math.PI) / 3)));
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    expect(max - min).toBeLessThan(min * 0.6);
  });
});

describe("hands", () => {
  it("draws all three, and each differently", () => {
    const drawn = HANDS.map((h) => Array.from(handFrame(25, h)).join(""));
    expect(new Set(drawn).size).toBe(3);
    for (const h of HANDS) expect(lit(handFrame(25, h))).toBeGreaterThan(10);
  });

  it("knows who won", () => {
    expect(beats("rock", "scissors")).toBe("win");
    expect(beats("scissors", "rock")).toBe("lose");
    expect(beats("paper", "paper")).toBe("draw");
    expect(beats("paper", "rock")).toBe("win");
    expect(beats("scissors", "paper")).toBe("win");
  });
});

describe("eightBallFrame", () => {
  it("is a ball with the numeral taken out of it, not a numeral on its own", () => {
    const ball = eightBallFrame(25);
    const digit = textFrame(25, "8")!;
    expect(lit(ball)).toBeGreaterThan(lit(digit) * 4);
    let punched = 0;
    for (let i = 0; i < ball.length; i++) if (digit[i] > 0 && ball[i] === 0) punched++;
    expect(punched).toBeGreaterThan(0);
  });
});
