#!/usr/bin/env node

import { Preprocessor } from "./dist/preprocessor/preprocessor.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

async function main() {
  console.log("=== Preprocessor Demo ===\n");

  // Initialize preprocessor
  const preprocessor = new Preprocessor({
    basePath: "./examples/preprocessor",
    maxDepth: 10,
    cache: true,
  });

  // Read main file
  const mainPath = "./examples/preprocessor/main.blocks";
  const content = await fs.readFile(mainPath, "utf-8");

  console.log("Original content:");
  console.log("-".repeat(50));
  console.log(content);
  console.log("-".repeat(50));
  console.log();

  // Process includes
  const result = await preprocessor.process(content, mainPath);

  console.log("Processed content:");
  console.log("-".repeat(50));
  console.log(result.content);
  console.log("-".repeat(50));
  console.log();

  console.log("Included files:");
  result.includedFiles.forEach((file) => console.log(`  - ${file}`));
  console.log();

  if (result.errors.length > 0) {
    console.log("Errors:");
    result.errors.forEach((error) =>
      console.log(`  - [${error.type}] ${error.message}`),
    );
  } else {
    console.log("No errors!");
  }
}

main().catch(console.error);
