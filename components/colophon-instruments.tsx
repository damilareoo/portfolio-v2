"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A token row that tells the truth about itself.
 *
 * The hex is not typed into the page — it is read back off the live computed
 * value, so the colophon cannot drift out of date with the stylesheet. Click
 * copies it.
 */
export function TokenRow({ token }: { token: string }) {
  const swatchRef = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const read = () => {
      const node = swatchRef.current;
      if (!node) return;
      const rgb = getComputedStyle(node).backgroundColor;
      const nums = rgb.match(/\d+/g);
      if (!nums || nums.length < 3) return;
      setValue(
        `#${nums
          .slice(0, 3)
          .map((n) => Number(n).toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()}`,
      );
    };

    read();
    // The value field and the theme dial both rewrite these underneath us.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => {
      observer.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard unavailable — the value is on screen either way.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center gap-3 rule-b py-2 text-left last:bg-none"
    >
      <span
        ref={swatchRef}
        style={{ background: `var(--${token})` }}
        className="size-4 shrink-0 border border-line"
      />
      <span className="flex-1 font-mono text-[0.625rem] text-ink-2">--{token}</span>
      <span className="font-mono text-[0.625rem] text-ink-3 transition-colors group-hover:text-ink-2">
        {copied ? "Copied" : (value ?? "····")}
      </span>
    </button>
  );
}

/**
 * A specimen you can set rather than read.
 *
 * Weight and size are dragged directly on the sample — the colophon documents
 * the type by handing you the two axes that define it, which is the same
 * argument the DialKit makes about the tokens.
 */
export function TypeSpecimen({
  sample,
  face,
  role,
  mono = false,
  weights,
}: {
  sample: string;
  face: string;
  role: string;
  mono?: boolean;
  weights: number[];
}) {
  const [weight, setWeight] = useState(weights[Math.floor(weights.length / 2)]);
  const [size, setSize] = useState(28);

  return (
    <div className="rule-b py-6 last:bg-none">
      <p
        style={{
          fontWeight: weight,
          fontSize: `${size}px`,
          lineHeight: 1.15,
        }}
        className={`select-none break-words tracking-tight ${mono ? "font-mono" : "font-sans"}`}
      >
        {sample}
      </p>

      <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <dl className="space-y-1">
          <div className="flex gap-4">
            <dt className="w-14 shrink-0 font-mono text-[0.625rem] text-ink-3">Face</dt>
            <dd className="font-mono text-[0.625rem] text-ink-2">{face}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-14 shrink-0 font-mono text-[0.625rem] text-ink-3">Role</dt>
            <dd className="font-mono text-[0.625rem] text-ink-2">{role}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-14 shrink-0 font-mono text-[0.625rem] text-ink-3">Weight</span>
            <div className="flex items-baseline gap-2">
              {weights.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeight(w)}
                  aria-pressed={weight === w}
                  style={{ fontWeight: w }}
                  className={`font-mono text-[0.6875rem] transition-colors ${
                    weight === w ? "text-ink" : "text-ink-3 hover:text-ink-2"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3">
            <span className="w-14 shrink-0 font-mono text-[0.625rem] text-ink-3">Size</span>
            <input
              type="range"
              min={12}
              max={72}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="h-1 flex-1 cursor-ew-resize appearance-none rounded-full bg-surface-2 accent-ink"
            />
            <span className="w-10 shrink-0 text-right font-mono text-[0.625rem] tabular-nums text-ink-2">
              {size}px
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
