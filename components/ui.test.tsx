// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RecordRow } from "@/components/ui";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (ui: React.ReactElement) => act(() => root.render(ui));

describe("RecordRow", () => {
  it("puts the label and its value in one grid row", () => {
    render(<RecordRow label="Year">2025</RecordRow>);
    const row = host.firstElementChild!;
    expect(row.className).toContain("grid-cols-[72px_minmax(0,1fr)]");
    expect(row.textContent).toBe("Year2025");
  });

  it("draws a dotted separator that the last row clears", () => {
    // The rule is a background image, so it is cleared with bg-none, never a border utility.
    render(<RecordRow label="Year">2025</RecordRow>);
    const cls = host.firstElementChild!.className;
    expect(cls).toContain("rule-b");
    expect(cls).toContain("last:bg-none");
  });

  it("renders a value that is markup, not only a string", () => {
    render(<RecordRow label="Live"><a href="https://example.com">example.com</a></RecordRow>);
    expect(host.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  });
});
