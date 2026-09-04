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

const STEPS = ["2xs", "xs", "sm", "base", "lg", "xl"] as const;

/** How a step is declared: a bare rem, or a clamp() of three terms. */
function declaration(step: string): string {
  const match = css.match(new RegExp(`--text-${step}:\\s*([^;]+);`));
  if (!match) throw new Error(`--text-${step} is not declared in the stylesheet`);
  return match[1].trim();
}

describe("the type scale", () => {
  it("declares every step", () => {
    for (const step of STEPS) expect(declaration(step), step).not.toHaveLength(0);
  });

  it("bounds every step in rem, so the visitor's own text size still reaches it", () => {
    /* This used to read "in rem, so the type dial reaches them", and the dial
       is gone. The requirement outlived it and got stricter rather than
       looser: a size expressed only in viewport units is pinned to the window
       and ignores the text size the visitor set in their browser, which is a
       worse version of what the dial was apologising for. So a step is either
       a bare rem or a clamp() whose floor, ceiling, and the leading term of
       its preferred value are all rem. */
    for (const step of STEPS) {
      const value = declaration(step);
      if (!value.startsWith("clamp(")) {
        expect(value, step).toMatch(/^[\d.]+rem$/);
        continue;
      }
      const terms = value.slice("clamp(".length, -1).split(",").map((t) => t.trim());
      expect(terms, step).toHaveLength(3);
      const [min, preferred, max] = terms;
      expect(min, `${step} floor`).toMatch(/^[\d.]+rem$/);
      expect(max, `${step} ceiling`).toMatch(/^[\d.]+rem$/);
      expect(preferred, `${step} preferred`).toMatch(/^[\d.]+rem\s*\+/);
    }
  });

  it("keeps the three small steps fixed", () => {
    /* Captions, labels, years and counts. They are already at the floor of what
       is readable, and a caption that grows with the window is not a caption
       that got better — it is one that stopped being quiet. Growth is spent on
       the three steps that carry the name, the titles and the prose. */
    for (const step of ["2xs", "xs", "sm"]) {
      expect(declaration(step), step).toMatch(/^[\d.]+rem$/);
    }
    for (const step of ["base", "lg", "xl"]) {
      expect(declaration(step), step).toMatch(/^clamp\(/);
    }
  });

  it("exposes the steps to Tailwind", () => {
    for (const step of STEPS) {
      expect(css).toContain(`--text-${step}: var(--text-${step})`);
    }
  });

  it("leaves no arbitrary font size in the surfaces it governs", () => {
    /* The defect this was written against: nine sizes chosen per component, so
       nothing could be louder than anything else on purpose. That defect has
       nothing to do with the dial, so this outlives it unchanged in intent and
       wider in reach — a size smuggled in as px, em, a viewport unit or a
       clamp() of its own is the same defect wearing a different unit. Colour
       and other non-length arbitraries are not font sizes and are not caught. */
    const offenders: string[] = [];
    for (const file of GOVERNED) {
      const source = readFileSync(resolve(root, file), "utf8");
      for (const [match] of source.matchAll(
        /text-\[(?:clamp\(|[\d.]+(?:rem|px|em|ch|vw|vh|vmin|vmax|pt))/g,
      )) {
        offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
