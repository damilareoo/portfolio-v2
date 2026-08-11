"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSettings, type Step } from "@/lib/settings";

type Option<T extends string> = { value: T; label: string; className?: string };

function DialRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`transition-colors ${o.className ?? "text-[0.75rem]"} ${
                active
                  ? "font-medium text-ink"
                  : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DialKit() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { density, typeScale, setDensity, setTypeScale } = useSettings();

  useEffect(() => setMounted(true), []);

  const steps: Option<Step>[] = [
    { value: "s", label: "S" },
    { value: "m", label: "M" },
    { value: "l", label: "L" },
  ];

  return (
    <div>
      <DialRow
        label="Theme"
        value={mounted ? (theme as "light" | "dark" | "system") : undefined}
        onChange={setTheme}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "Auto" },
        ]}
      />
      <DialRow
        label="Type"
        value={mounted ? typeScale : undefined}
        onChange={setTypeScale}
        options={[
          { value: "s", label: "Aa", className: "text-[0.625rem]" },
          { value: "m", label: "Aa", className: "text-[0.8125rem]" },
          { value: "l", label: "Aa", className: "text-[1rem]" },
        ]}
      />
      <DialRow
        label="Density"
        value={mounted ? density : undefined}
        onChange={setDensity}
        options={steps}
      />
    </div>
  );
}
