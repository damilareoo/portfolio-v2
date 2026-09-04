// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ExperienceTimeline } from "@/components/experience-timeline";
import type { Role } from "@/data/experience";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const role = (company: string, period: string, extra: Partial<Role> = {}): Role => ({
  role: "Product Designer",
  company,
  url: `https://${company.toLowerCase()}.example`,
  period,
  location: "Remote",
  ...extra,
});

const THREE = [
  role("Endgame", "Apr 2026 — Aug 2026"),
  role("ChessEver", "Apr 2025 — Apr 2026"),
  role("HEX", "Mar 2025 — Apr 2026"),
];

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
/* The container carries --tl-rows and --tl-cols; a track carries --tl-lane. */
const tracks = () => [...host.querySelectorAll<HTMLElement>("[style*='--tl-lane']")];

describe("the experience timeline", () => {
  it("reads earliest first whatever order the record is kept in", () => {
    render(<ExperienceTimeline roles={THREE} />);
    expect(tracks().map((t) => t.querySelector("a")?.getAttribute("href"))).toEqual([
      "https://hex.example",
      "https://chessever.example",
      "https://endgame.example",
    ]);
  });

  it("puts concurrent roles on their own tracks and returns the third to the first", () => {
    render(<ExperienceTimeline roles={THREE} />);
    expect(tracks().map((t) => t.style.getPropertyValue("--tl-col"))).toEqual(["1", "2", "1"]);
    expect(host.firstElementChild!.getAttribute("style")).toContain("repeat(2,");
  });

  it("takes a role that overlaps both without a redesign", () => {
    /* The test the brief set: more history arrives and the same component
       places it. A third concurrent role is a third track, not a rewrite. */
    render(<ExperienceTimeline roles={[...THREE, role("Fourth", "Jun 2025 — Feb 2026")]} />);
    expect(host.firstElementChild!.getAttribute("style")).toContain("repeat(3,");
    expect(tracks()).toHaveLength(4);
  });

  it("links every role out to the company, safely", () => {
    render(<ExperienceTimeline roles={THREE} />);
    for (const link of host.querySelectorAll("a")) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("says in words what the wide arrangement says in columns", () => {
    render(<ExperienceTimeline roles={THREE} />);
    const concurrent = [...host.querySelectorAll("p")].filter(
      (p) => p.textContent === "Concurrent",
    );
    // HEX and ChessEver ran together; Endgame did not.
    expect(concurrent).toHaveLength(2);
    for (const note of concurrent) expect(note.className).toContain("sm:hidden");
  });

  it("caps a track only where nothing later takes it", () => {
    render(<ExperienceTimeline roles={THREE} />);
    const capped = tracks().map((t) => t.querySelectorAll("span.rounded-full").length);
    // A start dot each; a terminal ring on the two tracks that stop.
    expect(capped).toEqual([1, 2, 2]);
  });

  it("draws no chart at all when there are no roles", () => {
    render(<ExperienceTimeline roles={[]} />);
    expect(host.innerHTML).toBe("");
  });
});
