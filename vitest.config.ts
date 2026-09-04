import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// The glyph engine and frame sources are pure, so they test in node with no
// browser environment and no React. The cell is the one piece that has to be
// mounted to be believed; it asks for jsdom in its own docblock.
export default defineConfig({
  test: {
    environment: "node",
    // Route handlers are here too: what a route answers when it cannot read is
    // half of the honesty rule, and the client half is worth little on its own.
    include: [
      "app/**/*.test.ts",
      "lib/**/*.test.ts",
      /* `lib/reveal.tsx` is a pair of hooks rather than a component, but a hook
         still has to be mounted to be run, so its test asks for jsdom the same
         way the cell's does. */
      "lib/**/*.test.tsx",
      "components/**/*.test.tsx",
      "data/**/*.test.ts",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": resolve(__dirname, ".") } },
});
