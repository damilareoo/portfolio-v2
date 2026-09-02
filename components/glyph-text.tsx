import { GLYPH_GAP, GLYPH_HEIGHT, glyphBits, textWidth } from "@/lib/glyph/font";
import { pixelGeometry } from "@/lib/glyph/pixel";

/* One cell is one unit of the viewBox, as GlyphIcon has it, so the geometry is
   computed once for every numeral on the site rather than per render. */
const { side, radius, offset } = pixelGeometry(1);

/**
 * A short string in the matrix's own 3x5 alphabet, drawn as SVG.
 *
 * Sized off the text height so the type dial reaches it, and `aria-hidden`
 * because it never says anything a heading beside it has not already said —
 * a product's number is ordering made visible, not information.
 */
export function GlyphText({
  text,
  size = "1em",
  className,
}: {
  text: string;
  /** Any CSS length; sets the glyph height, width follows the string. */
  size?: string;
  className?: string;
}) {
  const width = textWidth(text);
  const cells: { x: number; y: number }[] = [];

  let cursor = 0;
  for (const char of text) {
    const glyph = glyphBits(char);
    if (!glyph) continue;
    if (cursor > 0) cursor += GLYPH_GAP;
    for (let row = 0; row < GLYPH_HEIGHT; row++) {
      for (let col = 0; col < glyph.w; col++) {
        if (glyph.bits[row * glyph.w + col]) cells.push({ x: cursor + col, y: row });
      }
    }
    cursor += glyph.w;
  }

  if (!width) return null;

  return (
    <svg
      height={size}
      width={`calc(${size} * ${width} / ${GLYPH_HEIGHT})`}
      viewBox={`0 0 ${width} ${GLYPH_HEIGHT}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x + offset}
          y={cell.y + offset}
          width={side}
          height={side}
          rx={radius}
        />
      ))}
    </svg>
  );
}
