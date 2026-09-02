/**
 * WCAG contrast, computed rather than eyeballed.
 *
 * The site's tertiary ink carries every label, year and caption it has, at
 * --text-xs, 0.6875rem. Whether that is legible is a measurement, not a matter
 * of taste, and a retune that breaks it should fail a test rather than ship and
 * be noticed by somebody squinting.
 */

function channels(hex: string): [number, number, number] {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** sRGB companding, per WCAG 2.1 relative luminance. */
function toLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const one = relativeLuminance(a);
  const two = relativeLuminance(b);
  const [hi, lo] = one > two ? [one, two] : [two, one];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The token values as authored, read out of the stylesheet itself.
 *
 * Read rather than duplicated: a copy of the palette in a test file is a second
 * source of truth that goes stale the first time somebody edits the CSS.
 */
export function readSkins(css: string): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const block = (selector: string) => {
    const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
    if (!match) throw new Error(`no ${selector} block in the stylesheet`);
    const tokens: Record<string, string> = {};
    for (const [, name, value] of match[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
      tokens[name] = value;
    }
    return tokens;
  };
  return { light: block(":root"), dark: block("\\.dark") };
}
