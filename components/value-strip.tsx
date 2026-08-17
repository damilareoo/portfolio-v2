/**
 * The mockups give each project a row of coloured dots. Monochrome cannot take
 * that literally, so the strip carries the project's real palette desaturated,
 * and returns it to full colour only while a pointer is held on it.
 *
 * That is lawful — nothing moves until touched — and it makes the restraint
 * legible by showing what the site is holding back.
 */
export function ValueStrip({ palette }: { palette?: string[] }) {
  if (!palette?.length) return null;

  return (
    <span
      className="group/strip inline-flex items-center gap-1 align-middle"
      aria-hidden
      title="Project palette"
    >
      {palette.map((hex, i) => (
        <span
          key={`${hex}-${i}`}
          style={{ background: hex }}
          className="size-2 rounded-full opacity-70 grayscale transition-[filter,opacity] duration-200 group-hover/strip:opacity-100 group-hover/strip:grayscale-0"
        />
      ))}
    </span>
  );
}
