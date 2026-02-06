#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "./index.js";

interface CliOptions {
  to?: string; // Output format (currently only 'ast' supported)
  output?: string; // Output file path (-o)
  pretty?: boolean; // Pretty-print JSON
  basePath?: string; // Base path for output files
  inputFiles: string[]; // Input file paths
  useStdin: boolean; // Whether to read from stdin
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    inputFiles: [],
    useStdin: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg) break;

    if (arg === "--to") {
      options.to = args[i + 1];
      i += 2;
    } else if (arg === "-o" || arg === "--output") {
      options.output = args[i + 1];
      i += 2;
    } else if (arg === "--pretty") {
      options.pretty = true;
      i += 1;
    } else if (arg === "--base-path") {
      options.basePath = args[i + 1];
      i += 2;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else {
      // Input file
      options.inputFiles.push(arg);
      i += 1;
    }
  }

  // If no input files provided, use stdin
  if (options.inputFiles.length === 0) {
    options.useStdin = true;
  }

  return options;
}

function showHelp(): void {
  console.log(`Usage: blocks [options] [files...]

Parse .blocks files and export to JSON (AST)

Options:
  --to <format>        Output format (default: ast)
  -o, --output <file>  Output file (default: stdout or auto-generated)
  --pretty             Pretty-print JSON output
  --base-path <path>   Base path for output files

Examples:
  blocks input.blocks                    # → input.json
  blocks input.blocks -o output.json     # → output.json
  blocks --pretty input.blocks           # JSON with indentation
  blocks file1.blocks file2.blocks       # → file1.json, file2.json
  blocks *.blocks                        # → *.json
  cat input.blocks | blocks              # → stdout (JSON)
  cat input.blocks | blocks -o out.json  # → out.json
  blocks --to ast input.blocks           # → input.json`);
}

async function processFile(
  inputPath: string,
  options: CliOptions,
): Promise<void> {
  try {
    // Read input file
    const content = fs.readFileSync(inputPath, "utf-8");

    // Parse content
    const result = parse(content);

    // Check for errors
    if (result.errors.length > 0) {
      console.error(`Errors in ${inputPath}:`);
      for (const error of result.errors) {
        console.error(`  ${error}`);
      }
      // Continue processing even with errors, output the AST
    }

    // Determine output path
    let outputPath: string;
    if (options.output) {
      outputPath = options.output;
    } else {
      // Auto-generate output filename by replacing extension with .json
      const parsedPath = path.parse(inputPath);
      const baseName = parsedPath.name;
      const baseDir = options.basePath || parsedPath.dir || ".";
      outputPath = path.join(baseDir, `${baseName}.json`);
    }

    // Serialize AST to JSON
    const json = options.pretty
      ? JSON.stringify(result.ast, null, 2)
      : JSON.stringify(result.ast);

    // Write output
    fs.writeFileSync(outputPath, json, "utf-8");
    console.error(`Generated: ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing ${inputPath}: ${error.message}`);
    } else {
      console.error(`Error processing ${inputPath}: ${String(error)}`);
    }
    process.exit(1);
  }
}

async function processStdin(options: CliOptions): Promise<void> {
  try {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    const content = Buffer.concat(chunks).toString("utf-8");

    // Parse content
    const result = parse(content);

    // Check for errors
    if (result.errors.length > 0) {
      console.error("Parse errors:");
      for (const error of result.errors) {
        console.error(`  ${error}`);
      }
      // Continue processing even with errors, output the AST
    }

    // Serialize AST to JSON
    const json = options.pretty
      ? JSON.stringify(result.ast, null, 2)
      : JSON.stringify(result.ast);

    // Write output
    if (options.output) {
      fs.writeFileSync(options.output, json, "utf-8");
      console.error(`Generated: ${options.output}`);
    } else {
      // Output to stdout
      console.log(json);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing stdin: ${error.message}`);
    } else {
      console.error(`Error processing stdin: ${String(error)}`);
    }
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const options = parseArgs(args);

  // Validate --to option (currently only 'ast' is supported)
  if (options.to && options.to !== "ast") {
    console.error(
      `Invalid format: ${options.to}. Currently only 'ast' is supported.`,
    );
    process.exit(1);
  }

  // Process files or stdin
  if (options.useStdin) {
    await processStdin(options);
  } else {
    // Process each input file
    for (const inputFile of options.inputFiles) {
      await processFile(inputFile, options);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
