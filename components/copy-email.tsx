"use client";

import { useEffect, useRef, useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-between gap-3 rounded-full border border-line px-4 py-2.5 transition-colors hover:border-ink-3"
    >
      <span className="truncate font-mono text-[0.6875rem] text-ink-2">{email}</span>
      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
