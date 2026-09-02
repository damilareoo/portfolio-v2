import { EraEntry } from "@/components/era-entry";
import { GlyphIcon } from "@/components/glyph-icon";
import { GlyphText } from "@/components/glyph-text";
import { SectionLabel } from "@/components/ui";
import { findWork, type WorkItem } from "@/data/work";
import { workAssets } from "@/data/assets.generated";
import type { Era } from "@/lib/eras";

/**
 * A stretch of working life, with its work under it.
 *
 * An era with nothing public says so. It gets no placeholder tile — v1.9.1
 * deleted one of those on purpose, and a frame that stands for work nobody can
 * see is padding wearing the shape of evidence.
 */
export function EraSection({ era, index }: { era: Era; index: number }) {
  const entries = era.entries
    .map((slug) => findWork(slug))
    .filter((item): item is WorkItem => Boolean(item));

  return (
    <section id={era.id} className="rule-t scroll-mt-6 pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <div className="flex items-baseline gap-3">
          <GlyphText
            text={String(index + 1).padStart(2, "0")}
            size="0.5rem"
            className="shrink-0 text-ink-3"
          />
          <h2 className="text-[1.125rem] font-medium tracking-tight">
            {era.href ? (
              <a
                href={era.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-ink-2"
              >
                {era.name}{" "}
                <GlyphIcon
                  name="arrow-out"
                  size="0.5625rem"
                  className="inline-block align-baseline text-ink-3"
                />
              </a>
            ) : (
              era.name
            )}
          </h2>
          {era.role && <SectionLabel>{era.role}</SectionLabel>}
        </div>
        <SectionLabel>{era.period}</SectionLabel>
      </div>

      <p className="max-w-[44rem] text-[0.875rem] leading-relaxed text-ink-2">{era.blurb}</p>

      {entries.length > 0 ? (
        <div className="mt-9 space-y-16">
          {entries.map((item, i) => (
            <EraEntry
              key={item.slug}
              item={item}
              assets={workAssets[item.slug] ?? []}
              index={i}
              eraIndex={index}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[var(--radius-tile)] border border-dashed border-line p-[var(--pad)] font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
          Nothing public from this one yet.
        </p>
      )}
    </section>
  );
}
