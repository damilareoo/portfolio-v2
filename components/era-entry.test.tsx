// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EraEntry } from "@/components/era-entry";
import type { WorkItem } from "@/data/work";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

/* Text blocks only: this test is about the unfold, and mounting a Frame would
   drag next/image into a unit test that has nothing to say about it. */
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

describe("EraEntry", () => {
  it("shows the first two blocks without being asked", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Lede one.");
    expect(host.textContent).toContain("Lede two.");
  });

  it("keeps the collapsed tail in the DOM so it stays findable", () => {
    // Retiring the case pages cost three URLs; it must not also cost the text.
    render(<EraEntry item={item} assets={[]} index={0} />);
    expect(host.textContent).toContain("Buried treasure.");
    expect(host.querySelector("[hidden]")).toBeNull();
  });

  it("reports its state on the control, and flips it when touched", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.textContent).toContain("Open");

    act(() => { button.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toContain("Close");
  });

  it("points the control at the region it opens", () => {
    render(<EraEntry item={item} assets={[]} index={0} />);
    const id = host.querySelector("button")!.getAttribute("aria-controls")!;
    expect(host.querySelector(`#${CSS.escape(id)}`)).not.toBeNull();
  });

  /* The tail's PanelField is keyed to whether the fold has ever opened, so the
     sweep is built once. A revision that came back down on close rebuilt the
     observer while the tail was still at nearly full height, and every frame
     that had already arrived arrived again. Counted through the observer
     because that is the thing the rebuild creates. */
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

    render(<EraEntry item={withArt} assets={[]} index={0} />);
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

  it("offers no control when there is nothing more to show", () => {
    render(<EraEntry item={{ ...item, blocks: item.blocks!.slice(0, 2) }} assets={[]} index={0} />);
    expect(host.querySelector("button")).toBeNull();
  });
});
