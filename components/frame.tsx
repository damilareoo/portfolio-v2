import Image from "next/image";

/**
 * Every media slot on the site goes through here.
 *
 * An empty slot is not a collapsed one. Until art lands the frame prints what
 * is missing and what shape it will be — the same honesty rule the case pages
 * follow when a write-up does not exist yet.
 */
export function Frame({
  src,
  alt,
  width,
  height,
  ratio,
  label,
  sizes = "(min-width: 1024px) 50vw, 92vw",
  priority = false,
  className = "",
}: {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  /** CSS aspect-ratio for the slot when no intrinsic size is known. */
  ratio?: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const aspect = width && height ? `${width} / ${height}` : (ratio ?? "4 / 3");

  return (
    <div
      style={{ aspectRatio: aspect }}
      className={`relative overflow-hidden rounded-[var(--radius-tile)] border border-line bg-surface-2 transition-colors ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
            {label ?? "Awaiting art"}
          </span>
          <span className="font-mono text-[0.5625rem] text-ink-3 opacity-60">
            {aspect.replace(" / ", ":")}
          </span>
        </span>
      )}
    </div>
  );
}
