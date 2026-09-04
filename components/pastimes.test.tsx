// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pastimes } from "@/components/pastimes";
import { pastimes } from "@/data/site";

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

describe("the pastimes field", () => {
  it("renders nothing at all while there is nothing to show", () => {
    /* Not an empty frame, not a heading over a gap, not "coming soon". The
       page has to look finished today, and today there are no files. */
    render(<Pastimes items={[]} />);
    expect(host.innerHTML).toBe("");
  });

  it("ships empty", () => {
    // The state /about is actually in. If art lands, this is the test that
    // changes, and the one below already says what it should then look like.
    expect(pastimes).toEqual([]);
  });

  it("lays the pictures out the moment there are any", () => {
    render(
      <Pastimes
        items={[
          { src: "/play/board.jpg", alt: "A game in progress", caption: "Chess, most evenings", width: 1600, height: 1200 },
          { src: "/play/court.jpg", alt: "An empty court", caption: "Basketball, Saturdays", ratio: "3 / 4" },
        ]}
      />,
    );
    expect(host.querySelectorAll("li")).toHaveLength(2);
    expect(host.textContent).toContain("Chess, most evenings");
    expect(host.textContent).toContain("Basketball, Saturdays");
    expect(host.querySelector("h2")?.textContent).toBe("Pastimes");
  });

  it("puts every picture through the frame, so the screen cap reaches it", () => {
    render(
      <Pastimes items={[{ src: "/play/run.jpg", alt: "A road", caption: "Running", width: 1600, height: 1200 }]} />,
    );
    const frame = host.querySelector<HTMLElement>(".frame-cap");
    expect(frame).not.toBeNull();
    expect(frame!.style.aspectRatio).toBe("1600 / 1200");
    expect(frame!.style.getPropertyValue("--frame-ratio")).not.toBe("");
  });

  it("carries the alt text the entry gave it", () => {
    render(
      <Pastimes items={[{ src: "/play/run.jpg", alt: "A road at dawn", caption: "Running", ratio: "4 / 3" }]} />,
    );
    expect(host.querySelector("img")?.getAttribute("alt")).toBe("A road at dawn");
  });
});
