import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Blocks",
      fileName: "playground",
      formats: ["es"],
    },
    outDir: "dist",
    rollupOptions: {
      // Don't mark chevrotain as external for the playground build
      external: [],
    },
  },
});
