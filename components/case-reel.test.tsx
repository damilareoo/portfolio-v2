// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CaseReel } from "@/components/case-reel";
import type { CaseBlock } from "@/data/work";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("CaseReel presentation", () => {
  it("prints a caption where one is authored", () => {
    const blocks: CaseBlock[] = [{ kind: "full", caption: "The board, mid-game" }];
    render(<CaseReel blocks={blocks} assets={[]} />);
    expect(host.textContent).toContain("The board, mid-game");
  });

  it("gives a framed capture the frame it asks for", () => {
    const blocks: CaseBlock[] = [{ kind: "full", frame: "phone" }];
    render(<CaseReel blocks={blocks} assets={[]} />);
    expect(host.querySelector("[data-frame-style='phone']")).not.toBeNull();
  });

  it("leaves an unframed capture unframed", () => {
    // The treatment is authored per frame. Framing everything is the same
    // flatness with more decoration.
    const blocks: CaseBlock[] = [{ kind: "full" }];
    render(<CaseReel blocks={blocks} assets={[]} />);
    expect(host.querySelector("[data-frame-style]")).toBeNull();
  });

  it("lets one frame break the column", () => {
    const blocks: CaseBlock[] = [{ kind: "full", bleed: true }];
    render(<CaseReel blocks={blocks} assets={[]} />);
    expect(host.querySelector("[data-bleed]")).not.toBeNull();
  });
});
