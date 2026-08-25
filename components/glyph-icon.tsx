import { ICON_GRID, litCells, type IconName } from "@/lib/glyph/icons";
import { pixelGeometry } from "@/lib/glyph/pixel";

/* One cell is one unit of the viewBox, so the icon scales with its box and the
   geometry is computed once for every icon on the site rather than per render. */
const { side, radius, offset } = pixelGeometry(1);

/**
 * A mark in the site's own language, drawn as SVG rather than on a canvas.
 *
 * GlyphCell carries pointer tracking, springs, ripples and an arrival sweep —
 * everything an instrument needs and an icon must not have. This has no state
 * and no effects, which is what lets it stand inside a server component: an
 * icon in the nav costs nothing at runtime and adds nothing to the bundle.
 *
 * Unlit cells are not drawn at all. A cell that is off is simply not there, as
 * the widget cards have had it since v1.6.0 — an icon quotes the panel, it does
 * not imitate one.
 *
 * Nothing here animates. An icon neither reports nor arrives, so Law 4 leaves
 * it still; a hover change belongs to the control around it, which was touched.
 */
export function GlyphIcon({
  name,
  size = "1em",
  className,
}: {
  name: IconName;
  /** Any CSS length. Defaults to the text size, so the type dial reaches it. */
  size?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {litCells(name).map((cell) => (
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
