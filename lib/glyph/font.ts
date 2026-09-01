/**
 * A 3x5 dot alphabet, drawn here rather than shipped as a font file so the
 * numerals are made of the same cells as everything else on the matrix.
 */
const HEIGHT = 5;
const GAP = 1;

type Glyph = { w: number; bits: number[] };

const GLYPHS: Record<string, Glyph> = {
  "0": { w: 3, bits: [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1] },
  "1": { w: 3, bits: [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1] },
  "2": { w: 3, bits: [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1] },
  "3": { w: 3, bits: [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1] },
  "4": { w: 3, bits: [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1] },
  "5": { w: 3, bits: [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1] },
  "6": { w: 3, bits: [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1] },
  "7": { w: 3, bits: [1,1,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1] },
  "8": { w: 3, bits: [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1] },
  "9": { w: 3, bits: [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1] },
  ",": { w: 1, bits: [0, 0, 0, 1, 1] },
  "%": { w: 3, bits: [1,0,1, 0,0,1, 0,1,0, 1,0,0, 1,0,1] },
  " ": { w: 2, bits: [0,0, 0,0, 0,0, 0,0, 0,0] },

  /* The alphabet, so the field can say a word and not only a number. Three
     cells is the narrowest a letter can be and still be told apart; M and N
     are the pair it costs, and they are close but not the same. */
  "A": { w: 3, bits: [0,1,0, 1,0,1, 1,1,1, 1,0,1, 1,0,1] },
  "B": { w: 3, bits: [1,1,0, 1,0,1, 1,1,0, 1,0,1, 1,1,0] },
  "C": { w: 3, bits: [0,1,1, 1,0,0, 1,0,0, 1,0,0, 0,1,1] },
  "D": { w: 3, bits: [1,1,0, 1,0,1, 1,0,1, 1,0,1, 1,1,0] },
  "E": { w: 3, bits: [1,1,1, 1,0,0, 1,1,0, 1,0,0, 1,1,1] },
  "F": { w: 3, bits: [1,1,1, 1,0,0, 1,1,0, 1,0,0, 1,0,0] },
  "G": { w: 3, bits: [0,1,1, 1,0,0, 1,0,1, 1,0,1, 0,1,1] },
  "H": { w: 3, bits: [1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1] },
  "I": { w: 3, bits: [1,1,1, 0,1,0, 0,1,0, 0,1,0, 1,1,1] },
  "J": { w: 3, bits: [0,0,1, 0,0,1, 0,0,1, 1,0,1, 0,1,0] },
  "K": { w: 3, bits: [1,0,1, 1,0,1, 1,1,0, 1,0,1, 1,0,1] },
  "L": { w: 3, bits: [1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,1,1] },
  "M": { w: 3, bits: [1,0,1, 1,1,1, 1,1,1, 1,0,1, 1,0,1] },
  "N": { w: 3, bits: [1,0,1, 1,1,1, 1,1,1, 1,1,1, 1,0,1] },
  "O": { w: 3, bits: [0,1,0, 1,0,1, 1,0,1, 1,0,1, 0,1,0] },
  "P": { w: 3, bits: [1,1,0, 1,0,1, 1,1,0, 1,0,0, 1,0,0] },
  "Q": { w: 3, bits: [0,1,0, 1,0,1, 1,0,1, 1,1,1, 0,1,1] },
  "R": { w: 3, bits: [1,1,0, 1,0,1, 1,1,0, 1,0,1, 1,0,1] },
  "S": { w: 3, bits: [0,1,1, 1,0,0, 0,1,0, 0,0,1, 1,1,0] },
  "T": { w: 3, bits: [1,1,1, 0,1,0, 0,1,0, 0,1,0, 0,1,0] },
  "U": { w: 3, bits: [1,0,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1] },
  "V": { w: 3, bits: [1,0,1, 1,0,1, 1,0,1, 1,0,1, 0,1,0] },
  "W": { w: 3, bits: [1,0,1, 1,0,1, 1,1,1, 1,1,1, 1,0,1] },
  "X": { w: 3, bits: [1,0,1, 1,0,1, 0,1,0, 1,0,1, 1,0,1] },
  "Y": { w: 3, bits: [1,0,1, 1,0,1, 0,1,0, 0,1,0, 0,1,0] },
  "Z": { w: 3, bits: [1,1,1, 0,0,1, 0,1,0, 1,0,0, 1,1,1] },
  "?": { w: 3, bits: [1,1,1, 0,0,1, 0,1,1, 0,0,0, 0,1,0] },
  "!": { w: 3, bits: [0,1,0, 0,1,0, 0,1,0, 0,0,0, 0,1,0] },
  "-": { w: 3, bits: [0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0] },
  ":": { w: 1, bits: [0, 1, 0, 1, 0] },
  ".": { w: 1, bits: [0, 0, 0, 0, 1] },
};

export const GLYPH_HEIGHT = HEIGHT;
export const GLYPH_GAP = GAP;

/**
 * One character's cells, for renderers that draw rather than stamp.
 *
 * `stampText` writes into a canvas frame, which is what the matrix wants and
 * what an icon standing beside a heading cannot use. Unknown characters return
 * null so a caller skips them, exactly as `textWidth` does.
 */
export function glyphBits(char: string): { w: number; bits: number[] } | null {
  return GLYPHS[char] ?? null;
}

export function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const glyph = GLYPHS[char];
    if (!glyph) continue;
    if (width > 0) width += GAP;
    width += glyph.w;
  }
  return width;
}

/** Stamps lit cells into `frame`. Cells outside the grid are dropped, never wrapped. */
export function stampText(
  frame: Float32Array,
  grid: number,
  text: string,
  left: number,
  top: number,
): void {
  let x = left;
  for (const char of text) {
    const glyph = GLYPHS[char];
    if (!glyph) continue;
    for (let row = 0; row < HEIGHT; row++) {
      for (let col = 0; col < glyph.w; col++) {
        if (!glyph.bits[row * glyph.w + col]) continue;
        const gx = x + col;
        const gy = top + row;
        if (gx < 0 || gx >= grid || gy < 0 || gy >= grid) continue;
        frame[gy * grid + gx] = 1;
      }
    }
    x += glyph.w + GAP;
  }
}
