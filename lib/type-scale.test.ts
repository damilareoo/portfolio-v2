import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8");

/** The surfaces this scale governs. /about and /colophon are out of scope. */
const GOVERNED = [
  "app/page.tsx",
  "app/shots/page.tsx",
  "components/ui.tsx",
  "components/case-reel.tsx",
  "components/frame.tsx",
  "components/site-nav.tsx",
  "components/site-footer.tsx",
  "components/era-entry.tsx",
  "components/era-section.tsx",
];

describe("the type scale", () => {
  it("declares every step, in rem so the type dial reaches them", () => {
    for (const step of ["2xs", "xs", "sm", "base", "lg", "xl"]) {
      expect(css).toMatch(new RegExp(`--text-${step}:\\s*[\\d.]+rem`));
    }
  });

  it("exposes the steps to Tailwind", () => {
    for (const step of ["2xs", "xs", "sm", "base", "lg", "xl"]) {
      expect(css).toContain(`--text-${step}: var(--text-${step})`);
    }
  });

  it("leaves no arbitrary font size in the surfaces it governs", () => {
    // The defect: nine sizes chosen per component, so nothing could be louder
    // than anything else on purpose.
    const offenders: string[] = [];
    for (const file of GOVERNED) {
      const source = readFileSync(resolve(root, file), "utf8");
      for (const [match] of source.matchAll(/text-\[[\d.]+rem\]/g)) {
        offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
