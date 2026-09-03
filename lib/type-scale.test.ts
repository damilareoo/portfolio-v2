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
  "components/site-header.tsx",
  "components/site-footer.tsx",
  /* Where the footer's type actually lives now: `site-footer.tsx` and
     `app/page.tsx` both draw the quiet line from here, so this is the one file
     that can put it off the scale. */
  "components/footer-line.tsx",
  "components/product.tsx",
  "components/instrument-card.tsx",
  "components/instrument-wall.tsx",
  "components/clock-face.tsx",
  "components/weather-face.tsx",
  /* The pedometer's overlay type. It sat at a literal 0.5rem — the one size on
     the site below the scale's own floor — laid over an 84px field where it
     collided with the reading it labelled. Governed now, so it cannot drift
     back off the scale the next time the face is retuned. */
  "components/glyph-bay.tsx",
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
