import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Preprocessor } from "../src/preprocessor/preprocessor.js";

const TEST_DIR = "/tmp/preprocessor-test";

describe("Preprocessor", () => {
  beforeEach(async () => {
    // Créer le répertoire de test
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Nettoyer le répertoire de test
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("Basic include functionality", () => {
    it("should process a simple #include in a comment block", async () => {
      const headerPath = path.join(TEST_DIR, "header.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(headerPath, "Header content here");
      await fs.writeFile(mainPath, "/* #include header.blocks */");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("/* Header content here */");
      expect(result.includedFiles).toContain(headerPath);
    });

    it("should process #include in a code block", async () => {
      const utilsPath = path.join(TEST_DIR, "utils.py");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(utilsPath, "def helper():\n    pass");
      await fs.writeFile(
        mainPath,
        "```python\n#include utils.py\n\ndef main():\n    pass\n```",
      );

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("def helper():");
      expect(result.includedFiles).toContain(utilsPath);
    });

    it("should process #include in a script block", async () => {
      const configPath = path.join(TEST_DIR, "config.js");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(configPath, "const config = { debug: true };");
      await fs.writeFile(
        mainPath,
        '!!!javascript\n#include config.js\n\nconsole.log("Main");\n!!!',
      );

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("const config = { debug: true };");
      expect(result.includedFiles).toContain(configPath);
    });

    it("should process multiple #include directives", async () => {
      const header1Path = path.join(TEST_DIR, "header1.blocks");
      const header2Path = path.join(TEST_DIR, "header2.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(header1Path, "Header 1");
      await fs.writeFile(header2Path, "Header 2");
      await fs.writeFile(
        mainPath,
        "/* #include header1.blocks */\n/* #include header2.blocks */",
      );

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("/* Header 1 */\n/* Header 2 */");
      expect(result.includedFiles).toContain(header1Path);
      expect(result.includedFiles).toContain(header2Path);
    });

    it("should handle #include anywhere in the content", async () => {
      const snippetPath = path.join(TEST_DIR, "snippet.txt");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(snippetPath, "included text");
      await fs.writeFile(mainPath, "Before\n#include snippet.txt\nAfter");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("Before\nincluded text\nAfter");
    });
  });

  describe("Path resolution", () => {
    it("should resolve relative paths correctly", async () => {
      const libDir = path.join(TEST_DIR, "lib");
      await fs.mkdir(libDir, { recursive: true });

      const utilsPath = path.join(libDir, "utils.py");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(utilsPath, "utility code");
      await fs.writeFile(mainPath, "#include ./lib/utils.py");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("utility code");
      expect(result.includedFiles).toContain(utilsPath);
    });

    it("should resolve parent directory paths", async () => {
      const commonPath = path.join(TEST_DIR, "common.blocks");
      const subDir = path.join(TEST_DIR, "sub");
      await fs.mkdir(subDir, { recursive: true });

      const mainPath = path.join(subDir, "main.blocks");

      await fs.writeFile(commonPath, "common content");
      await fs.writeFile(mainPath, "#include ../common.blocks");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("common content");
      expect(result.includedFiles).toContain(commonPath);
    });

    it("should resolve absolute paths", async () => {
      const absPath = path.join(TEST_DIR, "absolute.txt");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(absPath, "absolute content");
      await fs.writeFile(mainPath, `#include ${absPath}`);

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("absolute content");
    });
  });

  describe("Recursive includes", () => {
    it("should handle nested includes", async () => {
      const level2Path = path.join(TEST_DIR, "level2.blocks");
      const level1Path = path.join(TEST_DIR, "level1.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(level2Path, "Level 2 content");
      await fs.writeFile(level1Path, "#include level2.blocks");
      await fs.writeFile(mainPath, "#include level1.blocks");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("Level 2 content");
      expect(result.includedFiles).toHaveLength(2);
    });
  });

  describe("Error handling", () => {
    it("should handle file not found errors", async () => {
      const mainPath = path.join(TEST_DIR, "main.blocks");
      await fs.writeFile(mainPath, "#include nonexistent.blocks");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.type).toBe("read_error");
      expect(result.content).toContain("#include nonexistent.blocks");
    });

    it("should detect circular includes", async () => {
      const file1Path = path.join(TEST_DIR, "file1.blocks");
      const file2Path = path.join(TEST_DIR, "file2.blocks");

      await fs.writeFile(file1Path, "#include file2.blocks");
      await fs.writeFile(file2Path, "#include file1.blocks");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(file1Path, "utf-8"),
        file1Path,
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === "circular_include")).toBe(
        true,
      );
    });

    it("should respect max depth limit", async () => {
      // Create a deep chain of includes
      for (let i = 0; i < 15; i++) {
        const filePath = path.join(TEST_DIR, `level${i}.blocks`);
        const nextFile = i < 14 ? `level${i + 1}.blocks` : "end";
        await fs.writeFile(filePath, `#include ${nextFile}\n`);
      }

      const mainPath = path.join(TEST_DIR, "level0.blocks");
      const preprocessor = new Preprocessor({
        basePath: TEST_DIR,
        maxDepth: 5,
      });

      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === "max_depth_exceeded")).toBe(
        true,
      );
    });
  });

  describe("Caching", () => {
    it("should cache included files when enabled", async () => {
      const headerPath = path.join(TEST_DIR, "header.blocks");
      const main1Path = path.join(TEST_DIR, "main1.blocks");
      const main2Path = path.join(TEST_DIR, "main2.blocks");

      await fs.writeFile(headerPath, "Cached header");
      await fs.writeFile(main1Path, "#include header.blocks");
      await fs.writeFile(main2Path, "#include header.blocks");

      const preprocessor = new Preprocessor({
        basePath: TEST_DIR,
        cache: true,
      });

      // First process
      const result1 = await preprocessor.process(
        await fs.readFile(main1Path, "utf-8"),
        main1Path,
      );
      expect(result1.content).toBe("Cached header");

      // Second process should use cache
      const result2 = await preprocessor.process(
        await fs.readFile(main2Path, "utf-8"),
        main2Path,
      );
      expect(result2.content).toBe("Cached header");
    });

    it("should allow clearing the cache", async () => {
      const headerPath = path.join(TEST_DIR, "header.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(headerPath, "Original content");
      await fs.writeFile(mainPath, "#include header.blocks");

      const preprocessor = new Preprocessor({
        basePath: TEST_DIR,
        cache: true,
      });

      // First process
      const result1 = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );
      expect(result1.content).toBe("Original content");

      // Clear cache
      preprocessor.clearCache();

      // Update file
      await fs.writeFile(headerPath, "Updated content");

      // Second process should read the new content
      const result2 = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );
      expect(result2.content).toBe("Updated content");
    });

    it("should not cache when disabled", async () => {
      const headerPath = path.join(TEST_DIR, "header.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(headerPath, "Original content");
      await fs.writeFile(mainPath, "#include header.blocks");

      const preprocessor = new Preprocessor({
        basePath: TEST_DIR,
        cache: false,
      });

      // First process
      const result1 = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );
      expect(result1.content).toBe("Original content");

      // Update file
      await fs.writeFile(headerPath, "Updated content");

      // Second process should read the new content without clearing cache
      const result2 = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );
      expect(result2.content).toBe("Updated content");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty files", async () => {
      const emptyPath = path.join(TEST_DIR, "empty.blocks");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(emptyPath, "");
      await fs.writeFile(mainPath, "#include empty.blocks");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("");
    });

    it("should handle files with no includes", async () => {
      const mainPath = path.join(TEST_DIR, "main.blocks");
      await fs.writeFile(mainPath, "No includes here");

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toBe("No includes here");
      expect(result.includedFiles).toHaveLength(0);
    });

    it("should handle includes with different file extensions", async () => {
      const jsPath = path.join(TEST_DIR, "script.js");
      const pyPath = path.join(TEST_DIR, "script.py");
      const txtPath = path.join(TEST_DIR, "text.txt");
      const mainPath = path.join(TEST_DIR, "main.blocks");

      await fs.writeFile(jsPath, "// JavaScript");
      await fs.writeFile(pyPath, "# Python");
      await fs.writeFile(txtPath, "Plain text");
      await fs.writeFile(
        mainPath,
        "#include script.js\n#include script.py\n#include text.txt",
      );

      const preprocessor = new Preprocessor({ basePath: TEST_DIR });
      const result = await preprocessor.process(
        await fs.readFile(mainPath, "utf-8"),
        mainPath,
      );

      expect(result.errors).toHaveLength(0);
      expect(result.content).toContain("// JavaScript");
      expect(result.content).toContain("# Python");
      expect(result.content).toContain("Plain text");
      expect(result.includedFiles).toHaveLength(3);
    });
  });
});
