import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  server: {
    open: '/index.html'
  },
  build: {
    emptyOutDir: false, // Don't clear dist directory
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'parser/index': resolve(__dirname, 'src/parser/parser.ts'),
        'preprocessor/index': resolve(__dirname, 'src/preprocessor/index.ts'),
        'preprocessor/browser': resolve(__dirname, 'src/preprocessor/browser.ts'),
      },name: "Blocks",
      formats: ["es"],
    },
    rollupOptions: {
      external: [/^node:.*/],
    },
  },
    optimizeDeps: {
    exclude: ['node:fs/promises', 'node:path']
  },
  test: {
    globals: true,
    environment: "node",
  },
});
