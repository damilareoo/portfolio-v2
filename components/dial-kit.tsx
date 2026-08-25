"use client";

import { useTheme } from "next-themes";
import { useSettings, type Step } from "@/lib/settings";
import { useDialTurns } from "@/lib/dial-turns";
import { useMounted } from "@/lib/use-mounted";

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
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { density, typeScale, setDensity, setTypeScale } = useSettings();
  const { record } = useDialTurns();

  /* Every dial reports its turn. Re-selecting the current value is not a turn —
     the counter measures change, not clicks. */
  function turning<T extends string>(current: T | undefined, apply: (v: T) => void) {
    return (value: T) => {
      apply(value);
      if (mounted && value !== current) record();
    };
  }

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
        onChange={turning(mounted ? (theme as "light" | "dark" | "system") : undefined, setTheme)}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "Auto" },
        ]}
      />
      <DialRow
        label="Type"
        value={mounted ? typeScale : undefined}
        onChange={turning(mounted ? typeScale : undefined, setTypeScale)}
        options={[
          { value: "s", label: "Aa", className: "text-[0.625rem]" },
          { value: "m", label: "Aa", className: "text-[0.8125rem]" },
          { value: "l", label: "Aa", className: "text-[1rem]" },
        ]}
      />
      <DialRow
        label="Density"
        value={mounted ? density : undefined}
        onChange={turning(mounted ? density : undefined, setDensity)}
        options={steps}
      />
    </div>
  );
}
