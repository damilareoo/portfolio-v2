// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Product } from "@/components/product";
import type { WorkItem } from "@/data/work";
import type { AppCard } from "@/lib/app-store";

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

  /* Dropped when EraSection and EraEntry were merged into this component, and
     the code kept it. aria-expanded on its own says a control opens something
     without saying what: the tail stays in the DOM whether the fold is open or
     shut, so the only thing tying the bar to the panel it drives is this id. */
  it("points the control at the panel it actually opens", () => {
    render(<Product item={item} assets={[]} index={0} />);
    const button = host.querySelector("button")!;
    const controls = button.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(host.querySelector(`#${CSS.escape(controls!)}`)).not.toBeNull();
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

  /* The field ships empty on purpose — no case in data/work.ts records a
     collaborator yet — so these two are the only thing holding the shape of it
     until one does. The absent case matters more than the present one: a
     record row that renders blank, or renders an em dash, is claiming the
     question was asked and came back empty. */
  const labelled = (text: string) =>
    [...host.querySelectorAll("span")].find((s) => s.textContent === text);

  it("records collaborators, and links the ones with a site", () => {
    render(
      <Product
        item={{
          ...item,
          collaborators: [
            { name: "Ada Lovelace", url: "https://example.com", role: "Engineering" },
            { name: "Grace Hopper" },
          ],
        }}
        assets={[]}
        index={0}
      />,
    );
    expect(labelled("With")).toBeDefined();
    expect(host.textContent).toContain("Ada Lovelace");
    expect(host.textContent).toContain("Engineering");
    expect(host.textContent).toContain("Grace Hopper");

    const link = host.querySelector<HTMLAnchorElement>('a[href="https://example.com"]')!;
    expect(link.textContent).toBe("Ada Lovelace");
    expect(link.rel).toBe("noopener noreferrer");
    /* The one without a site is text. A name that is not a link must not be
       marked up as one, or it reads as a link that broke. */
    expect([...host.querySelectorAll("a")].some((a) => a.textContent === "Grace Hopper")).toBe(
      false,
    );
  });

  it("draws no row at all for a case with no collaborators", () => {
    render(<Product item={item} assets={[]} index={0} />);
    expect(labelled("With")).toBeUndefined();

    /* And an empty list is the same as no list: a field that exists but holds
       nobody is still a case with no recorded collaborators. */
    act(() => root.render(<Product item={{ ...item, collaborators: [] }} assets={[]} index={0} />));
    expect(labelled("With")).toBeUndefined();
  });

  it("keeps the year in the record, not in the head", () => {
    /* The App Store card is more furniture per entry than the page carried
       before, so something on the scanned surface had to leave. The year is the
       one thing four products in a column repeat four times while telling a
       reader almost nothing — and it is moved rather than dropped. */
    render(<Product item={item} assets={[]} index={0} />);
    const head = host.querySelector("h2")!.parentElement!;
    expect(head.textContent).not.toContain("2025");
    expect(labelled("Year")).toBeDefined();
    expect(host.textContent).toContain("2025");
  });

  it("offers no bar when there is nothing more to show", () => {
    render(<Product item={{ ...item, blocks: item.blocks!.slice(0, 2) }} assets={[]} index={1} />);
    expect(host.querySelector("button")).toBeNull();
  });

  /* An app entry is the same object as the three around it with a different
     first frame. These three hold that: the card stands where the opening frame
     stands, the count of frames does not change, and none of them is shown
     twice. */
  const app: AppCard = {
    slug: "example",
    storeUrl: "https://apps.apple.com/us/app/example/id1",
    name: "Example: On the Store",
    seller: "Example LLC",
    genre: "Games",
    rating: 4.5,
    ratingCount: 12,
    icon: "/apps/example/icon.jpg",
    shots: ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg"],
    shotRatio: "626 / 1354",
    source: "live",
  };

  it("opens an app entry on its store card, not on its authored frames", () => {
    render(<Product item={item} assets={[]} index={0} app={app} />);
    expect(host.querySelector("[data-store]")).not.toBeNull();
    expect(host.textContent).toContain("Example LLC");
    // The entry's own blocks are replaced, not joined: the reel is the store's.
    expect(host.textContent).not.toContain("Lede one.");
  });

  it("still shows an app three frames — the card, and two behind the bar", () => {
    /* Phase 6 cut a card to three frames and this is the arithmetic that keeps
       an app entry inside that: the card is the frame that stands open, and one
       plate of two screens waits behind the control. */
    render(<Product item={item} assets={[]} index={0} app={app} />);
    // One plate of two screens: two figures, three frames counting the card.
    expect(host.querySelectorAll("figure")).toHaveLength(2);
    /* Found by its words, not by being the first button on the card: the rail's
       two controls are buttons too, and they come first in the document. */
    const bar = [...host.querySelectorAll("button")].find((b) =>
      /case study/i.test(b.textContent ?? ""),
    );
    expect(bar?.textContent).toMatch(/open case study/i);
  });

  it("does not show an app the same screens twice", () => {
    /* The card ends in a rail carrying every screen the listing publishes, so
       any screen a plate also draws is on the page twice. Under the card that
       was 1043px of repetition on a 375px phone and made an app entry nearly
       twice the height of the products either side of it. The plate is behind
       the fold now, which is the whole of the fix: nothing above the control
       draws a screen the rail is not already the place for. */
    render(<Product item={item} assets={[]} index={0} app={app} />);
    const bar = [...host.querySelectorAll("button")].find((b) =>
      /case study/i.test(b.textContent ?? ""),
    )!;
    const before = (node: Element) =>
      Boolean(bar.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
    const figures = [...host.querySelectorAll("figure")];
    expect(figures.filter(before)).toHaveLength(0);
    expect(figures).toHaveLength(2);
    /* And the one thing that does draw screens above the control is the rail,
       which is where a listing shows them. */
    expect(host.querySelector("[data-store] ul")!.querySelectorAll("li")).toHaveLength(
      app.shots.length,
    );
  });
});
