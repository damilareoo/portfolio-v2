import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readSkins } from "./contrast";
import { VALUE_LADDER } from "./value-ladder";

const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
const skins = readSkins(css);

describe("the printed value ladder", () => {
  it("prints the hex the stylesheet actually declares, on both skins", () => {
    // The whole reason this list is allowed to exist as a list. /system shipped
    // the pre-retune ladder — light --bg printed #F4F4F4 while the site was
    // drawn in #f2f2f2 — and the swatch beside every wrong number was correct,
    // because it came from the token.
    for (const row of VALUE_LADDER) {
      expect(row.light.toLowerCase(), `--${row.token} light`).toBe(
        skins.light[`--${row.token}`].toLowerCase(),
      );
      expect(row.dark.toLowerCase(), `--${row.token} dark`).toBe(
        skins.dark[`--${row.token}`].toLowerCase(),
      );
    }
  });
});
