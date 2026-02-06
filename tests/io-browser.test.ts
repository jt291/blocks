import { describe, expect, it } from "vitest";
import { BrowserFileReader } from "../src/preprocessor/io-browser.js";

describe("BrowserFileReader", () => {
  describe("Path resolution", () => {
    it("should preserve relative paths with ./ prefix", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "header.blocks");
      expect(resolved).toBe("includes/header.blocks");
    });

    it("should preserve relative paths without ./ prefix", () => {
      const reader = new BrowserFileReader("includes/");
      const resolved = reader.resolve("", "header.blocks");
      expect(resolved).toBe("includes/header.blocks");
    });

    it("should handle absolute paths with / prefix", () => {
      const reader = new BrowserFileReader("/includes/");
      const resolved = reader.resolve("", "header.blocks");
      expect(resolved).toBe("/includes/header.blocks");
    });

    it("should resolve nested relative paths", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "./lib/utils.py");
      expect(resolved).toBe("includes/lib/utils.py");
    });

    it("should handle parent directory navigation", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("sub/file.blocks", "../common.blocks");
      expect(resolved).toBe("common.blocks");
    });

    it("should handle absolute URLs", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "https://example.com/file.js");
      expect(resolved).toBe("https://example.com/file.js");
    });

    it("should handle protocol-relative URLs", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "//cdn.example.com/lib.js");
      expect(resolved).toBe("//cdn.example.com/lib.js");
    });

    it("should handle absolute paths in includePath", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "/absolute/path.blocks");
      expect(resolved).toBe("/absolute/path.blocks");
    });

    it("should resolve relative to current file directory", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("includes/dir/file.blocks", "other.blocks");
      expect(resolved).toBe("includes/dir/other.blocks");
    });

    it("should normalize paths with dots correctly for relative basePaths", () => {
      const reader = new BrowserFileReader("./includes/");
      const resolved = reader.resolve("", "./sub/../lib/utils.py");
      expect(resolved).toBe("includes/lib/utils.py");
    });

    it("should normalize paths with dots correctly for absolute basePaths", () => {
      const reader = new BrowserFileReader("/includes/");
      const resolved = reader.resolve("", "./sub/../lib/utils.py");
      expect(resolved).toBe("/includes/lib/utils.py");
    });

    it("should handle empty basePath with relative include", () => {
      const reader = new BrowserFileReader("");
      const resolved = reader.resolve("", "file.blocks");
      expect(resolved).toBe("file.blocks");
    });

    it("should handle empty basePath with absolute include", () => {
      const reader = new BrowserFileReader("");
      const resolved = reader.resolve("", "/file.blocks");
      expect(resolved).toBe("/file.blocks");
    });
  });
});
