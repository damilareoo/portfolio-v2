// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Product } from "@/components/product";
import type { WorkItem } from "@/data/work";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

const item: WorkItem = {
  slug: "example",
  title: "Example",
  oneLiner: "One line.",
  year: "2025",
  disciplines: ["Product Design"],
  blocks: [
    { kind: "text", body: ["Lede one."] },
    { kind: "text", body: ["Lede two."] },
    { kind: "text", body: ["Buried treasure."] },
  ],
};

describe("Product", () => {
  it("numbers itself from its position, padded", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("01");
  });

  it("anchors on its own slug, because a retired URL lands here", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.querySelector("#example")).not.toBeNull();
  });

  it("shows the lede and keeps the collapsed tail in the DOM", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Lede one.");
    expect(host.textContent).toContain("Buried treasure.");
    expect(host.querySelector("[hidden]")).toBeNull();
  });

  it("labels the unfold with what is behind it", () => {
    // The chip this replaces was easy to miss; a full-width bar that names
    // what it opens, and renames itself once open, is not.
    render(<Product item={item} assets={[]} index={0} />);
    const button = host.querySelector("button")!;
    expect(button.textContent).toMatch(/open case study/i);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toMatch(/close/i);
  });

  /* Carried over from era-entry.test.tsx, which this file replaces. The tail's
     PanelField is keyed to whether the fold has ever opened, so the sweep is
     built once. A revision that came back down on close rebuilt the observer
     while the tail was still at nearly full height, and every frame that had
     already arrived arrived again. Counted through the observer because that is
     the thing the rebuild creates. */
  it("builds the tail's sweep once, and not again when the fold closes", () => {
    const withArt: WorkItem = {
      ...item,
      blocks: [
        { kind: "text", body: ["Lede one."] },
        { kind: "text", body: ["Lede two."] },
        { kind: "full", src: "/work/example/tail.png", alt: "Tail" },
      ],
    };
    let built = 0;
    class Counting {
      constructor() { built++; }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", Counting);

    render(<Product item={withArt} assets={[]} index={0} />);
    const before = built;
    const button = host.querySelector("button")!;

    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    const afterOpen = built;
    expect(afterOpen).toBeGreaterThan(before);

    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(built).toBe(afterOpen);

    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(built).toBe(afterOpen);
  });

  it("offers no bar when there is nothing more to show", () => {
    render(<Product item={{ ...item, blocks: item.blocks!.slice(0, 2) }} assets={[]} index={1} />);
    expect(host.querySelector("button")).toBeNull();
  });
});
