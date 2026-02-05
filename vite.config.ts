import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Blocks",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["chevrotain"],
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
