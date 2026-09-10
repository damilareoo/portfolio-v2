"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A token row that tells the truth about itself.
 *
 * The hex is not typed into the page — it is read back off the live computed
 * value, so the colophon cannot drift out of date with the stylesheet. Click
 * copies it.
 *
 * The last instrument left in this file. `TypeSpecimen` stood beside it and
 * went with the specimens: three draggable samples of a face the whole site is
 * already set in is a demonstration of the type rather than a statement of it,
 * and the colophon's job is the statement.
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
    // The theme control rewrites these underneath us.
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
