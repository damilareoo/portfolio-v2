// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStoreCard } from "@/components/app-store-card";
import type { AppCard } from "@/lib/app-store";

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
  vi.unstubAllGlobals();
});
const render = (ui: React.ReactElement) => act(() => root.render(ui));

const card: AppCard = {
  slug: "endgame-ai",
  storeUrl: "https://apps.apple.com/us/app/endgame-ai/id6755304651",
  name: "Endgame AI",
  seller: "Endgame Chess Inc",
  genre: "Games",
  rating: 4.73332,
  ratingCount: 30,
  icon: "/apps/endgame-ai/icon.jpg",
  shots: ["/apps/endgame-ai/01.jpg", "/apps/endgame-ai/02.jpg", "/apps/endgame-ai/03.jpg"],
  shotRatio: "626 / 1360",
  source: "live",
};

/** The five rating marks, in the order they are drawn. */
const marks = () => [...host.querySelectorAll("p svg")];
const button = (label: string) =>
  host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

describe("AppStoreCard", () => {
  it("carries the store's own header — name, seller, genre, and the way in", () => {
    render(<AppStoreCard app={card} />);
    expect(host.textContent).toContain("Endgame AI");
    expect(host.textContent).toContain("Endgame Chess Inc");
    expect(host.textContent).toContain("Games");
    const link = host.querySelector<HTMLAnchorElement>('a[href^="https://apps.apple.com"]')!;
    expect(link.rel).toContain("noopener");
    expect(link.target).toBe("_blank");
  });

  it("rounds the marks down and prints the figure exactly", () => {
    /* 4.73 is four marks and the number 4.7. Rounding to nearest would light
       all five, which is a fuller row than the app has earned — the site does
       not round a claim about its own work in its own favour. */
    render(<AppStoreCard app={card} />);
    expect(marks()).toHaveLength(5);
    const lit = marks().filter((m) => m.getAttribute("class") === "text-ink");
    expect(lit).toHaveLength(4);
    expect(host.textContent).toContain("4.7");
    expect(host.textContent).toContain("30");
  });

  it("says the rating once, as a sentence, for a reader that cannot see marks", () => {
    render(<AppStoreCard app={card} />);
    const spoken = [...host.querySelectorAll(".sr-only")].map((n) => n.textContent);
    expect(spoken).toContain("Rated 4.7 out of 5, from 30 ratings");
  });

  it("shows no rating at all when nobody has rated it", () => {
    // Nought out of five over nought votes is not a rating, and printing it
    // would be the card inventing a verdict on an app nobody has judged.
    render(<AppStoreCard app={{ ...card, rating: 0, ratingCount: 0 }} />);
    expect(marks()).toHaveLength(0);
    expect(host.textContent).not.toContain("ratings");
  });

  it("records where its figures came from, so the fallback can be checked", () => {
    /* Not printed anywhere. It is the seam that makes the degraded path
       verifiable — break the lookup, load the page, read the attribute — rather
       than a claim about a fallback that has only ever been argued for. */
    render(<AppStoreCard app={card} />);
    expect(host.querySelector("[data-store='live']")).not.toBeNull();
    render(<AppStoreCard app={{ ...card, source: "recorded" }} />);
    expect(host.querySelector("[data-store='recorded']")).not.toBeNull();
  });

  it("puts every screen on one rail that a keyboard can reach", () => {
    render(<AppStoreCard app={card} />);
    const rail = host.querySelector<HTMLUListElement>("ul[role='group']")!;
    expect(rail.tabIndex).toBe(0);
    expect(rail.getAttribute("aria-label")).toContain("Endgame AI");
    expect(rail.querySelectorAll("li")).toHaveLength(3);
  });

  it("moves the rail by one screen from the arrow keys", () => {
    /* A scroll container is only keyboard-scrollable in some browsers. Without
       this a keyboard visitor focuses the rail and finds that nothing moves.
       The step is measured off the item rather than written down, so this stubs
       the measurement the browser would have done. */
    render(<AppStoreCard app={card} />);
    const rail = host.querySelector<HTMLUListElement>("ul[role='group']")!;
    const item = host.querySelector("li")!;
    item.getBoundingClientRect = () => ({ width: 96 }) as DOMRect;
    const scrollBy = vi.fn();
    rail.scrollBy = scrollBy;

    act(() => {
      rail.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(scrollBy).toHaveBeenCalledWith({ left: 96, behavior: "smooth" });

    act(() => {
      rail.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -96, behavior: "smooth" });
  });

  it("holds still for a visitor who asked for less motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<AppStoreCard app={card} />);
    const rail = host.querySelector<HTMLUListElement>("ul[role='group']")!;
    host.querySelector("li")!.getBoundingClientRect = () => ({ width: 96 }) as DOMRect;
    const scrollBy = vi.fn();
    rail.scrollBy = scrollBy;
    act(() => {
      rail.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(scrollBy).toHaveBeenCalledWith({ left: 96, behavior: "auto" });
  });

  it("dims the control that cannot do anything", () => {
    // An unscrolled rail is at its start, so back is the one press that would
    // change nothing. jsdom lays nothing out, so the far end reads as reached.
    render(<AppStoreCard app={card} />);
    expect(button("Previous screens").disabled).toBe(true);
  });

  it("never starts moving on its own", () => {
    /* Law 4 admits motion under touch, on arrival once, or while reporting a
       live reading. A carousel that advances by itself is none of the three, so
       this file may not contain a timer. */
    vi.useFakeTimers();
    try {
      render(<AppStoreCard app={card} />);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
