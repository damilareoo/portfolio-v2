"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/lib/reveal";
import type { Asset } from "@/data/assets.generated";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

/** "2026-04" -> "April 2026". A bare year stays a bare year. */
function readableDate(date: string | null) {
  if (!date) return null;
  const [year, month] = date.split("-");
  if (!month) return year;
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
  });
  return `${name} ${year}`;
}

/**
 * The lightbox is the only place on the site that traps focus, so it has to
 * give it back: the tile that opened it is focused again on close, or a
 * keyboard visitor is dropped at the top of the document with no way back.
 */
function Lightbox({
  items,
  at,
  onClose,
  onStep,
}: {
  items: Asset[];
  at: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const item = items[at];

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
      // Nothing else is reachable while this is open, so Tab has nowhere to go.
      if (event.key === "Tab") event.preventDefault();
    };
    document.addEventListener("keydown", onKey);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onStep]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-[var(--pg-gap)] py-4">
        <Label>
          {String(at + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </Label>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-ink-2 transition-colors hover:text-ink"
        >
          Close
        </button>
      </div>

      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex min-h-0 flex-1 items-center justify-center px-[var(--pg-gap)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={item.src}
          alt={item.title}
          width={item.width}
          height={item.height}
          sizes="90vw"
          className="max-h-full w-auto rounded-[var(--radius-tile)] border border-line object-contain"
        />
      </div>

      <div
        className="flex shrink-0 items-center justify-between gap-4 px-[var(--pg-gap)] py-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-medium">{item.title}</p>
          {readableDate(item.date) && <Label>{readableDate(item.date)}</Label>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous"
            className="rounded-full border border-line px-3 py-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="Next"
            className="rounded-full border border-line px-3 py-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedGallery({ items, lastUpdated }: { items: Asset[]; lastUpdated: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpen((at) => (at === null ? at : (at + delta + items.length) % items.length));
    },
    [items.length],
  );

  const years = Array.from(
    new Set(items.map((item) => item.date?.slice(0, 4)).filter(Boolean) as string[]),
  ).sort((a, b) => b.localeCompare(a));

  const [year, setYear] = useState<string | null>(null);
  const shown = year ? items.filter((item) => item.date?.startsWith(year)) : items;

  if (!items.length) {
    return (
      <div className="rounded-[var(--radius-tile)] border border-dashed border-line p-[var(--pad)]">
        <Label>Nothing here yet</Label>
        <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-ink-2">
          The feed reads from <span className="font-mono text-[0.8125rem]">public/feed</span>.
          Drop images in, run <span className="font-mono text-[0.8125rem]">pnpm manifest</span>,
          and they appear here in date order.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setYear(null)}
            aria-pressed={year === null}
            className={`rounded-full px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors ${
              year === null ? "bg-strong text-on-strong" : "border border-line text-ink-2 hover:text-ink"
            }`}
          >
            All
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(year === y ? null : y)}
              aria-pressed={year === y}
              className={`rounded-full px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors ${
                year === y ? "bg-strong text-on-strong" : "border border-line text-ink-2 hover:text-ink"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Label>
            {String(shown.length).padStart(2, "0")} frame{shown.length === 1 ? "" : "s"}
          </Label>
          <Label>Updated {lastUpdated}</Label>
        </div>
      </div>

      {/* Columns, not a row grid — mixed aspect ratios pack without cropping. */}
      <div className="columns-1 gap-[var(--pg-gap)] sm:columns-2 lg:columns-3">
        {shown.map((item, i) => (
          <Reveal key={item.src} index={i} className="mb-[var(--pg-gap)] break-inside-avoid">
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpen(items.indexOf(item));
              }}
              className="group block w-full text-left"
            >
              <span className="relative block overflow-hidden rounded-[var(--radius-tile)] border border-line bg-surface-2 transition-[transform,border-color] duration-[120ms] ease-out group-hover:scale-[1.015] group-hover:border-ink-3">
                <Image
                  src={item.src}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 46vw, 92vw"
                  className="h-auto w-full"
                />
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-3">
                <span className="truncate text-[0.8125rem] text-ink-2 transition-colors group-hover:text-ink">
                  {item.title}
                </span>
                {readableDate(item.date) && <Label>{readableDate(item.date)}</Label>}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {open !== null && (
        <Lightbox items={items} at={open} onClose={close} onStep={step} />
      )}
    </>
  );
}
