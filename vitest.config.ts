import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// The glyph engine and frame sources are pure, so they test in node with no
// browser environment and no React.
export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
  resolve: { alias: { "@": resolve(__dirname, ".") } },
});
