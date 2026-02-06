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
  resolve: {
    alias: {
      // Map io-node imports to io-browser for playground
      './io-node.js': resolve(__dirname, 'src/preprocessor/io-browser.ts'),
      './io-node': resolve(__dirname, 'src/preprocessor/io-browser.ts'),
    },
  },
});
