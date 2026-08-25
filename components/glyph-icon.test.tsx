// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GlyphIcon } from "@/components/glyph-icon";
import { ICONS, ICON_GRID } from "@/lib/glyph/icons";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("GlyphIcon", () => {
  it("draws one rect per lit cell and none for the unlit ones", () => {
    render(<GlyphIcon name="arrow-left" />);
    const lit = ICONS["arrow-left"].bits.filter(Boolean).length;
    expect(host.querySelectorAll("rect")).toHaveLength(lit);
  });

  it("sits on the icon grid, so it scales with whatever box it is given", () => {
    render(<GlyphIcon name="light" />);
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${ICON_GRID} ${ICON_GRID}`);
  });

  it("takes its colour from the text around it, so both skins need no variant", () => {
    render(<GlyphIcon name="dark" />);
    expect(host.querySelector("svg")!.getAttribute("fill")).toBe("currentColor");
  });

  it("defaults to one em, so the type dial reaches it", () => {
    render(<GlyphIcon name="system" />);
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("1em");
    expect(svg.getAttribute("height")).toBe("1em");
  });

  it("is hidden from the accessibility tree — the control it sits in carries the name", () => {
    render(<GlyphIcon name="arrow-out" />);
    expect(host.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps a gap between pixels — a rect never fills its cell", () => {
    render(<GlyphIcon name="system" />);
    const rect = host.querySelector("rect")!;
    expect(Number(rect.getAttribute("width"))).toBeLessThan(1);
    expect(Number(rect.getAttribute("width"))).toBeGreaterThan(0);
  });
});
