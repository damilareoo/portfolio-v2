// jsdom has never implemented `matchMedia` (github.com/jsdom/jsdom#1076), so any
// jsdom test that mounts a component reading reduced-motion preference —
// `lib/reveal.tsx`, `lib/use-media-query.ts`, `glyph-cell.tsx`, `glyph-bay.tsx` —
// throws before it can assert anything. This stands in with a query that never
// matches; a test that cares about a specific media-query result stubs it
// itself with `vi.stubGlobal`, same as `components/glyph-cell.test.tsx` does.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom also has no global `CSS` object, so `CSS.escape` — the standard way to
// turn a `useId()` value into a safe selector — is missing too.
if (typeof globalThis.CSS === "undefined") {
  (globalThis as unknown as { CSS: { escape: (value: string) => string } }).CSS = {
    escape: (value: string) => value.replace(/([^\w-])/g, "\\$1"),
  };
}
