import { createFileReader } from "./io.js";
import type {
  FileReader,
  Include,
  LineMap,
  PreprocessorConfig,
  PreprocessorError,
  PreprocessorResult,
} from "./types.js";

/**
 * Result from processing content
 */
interface ProcessResult {
  content: string;
  includes: Include[];
  lineMap: LineMap[];
  errors: PreprocessorError[];
}

/**
 * Preprocessor for handling #include directives
 */
export class Preprocessor {
  private config: Required<PreprocessorConfig>;
  private fileReaderPromise: Promise<FileReader>;
  private cache: Map<string, string>;
  private includedFiles: Set<string>;

  constructor(config: PreprocessorConfig) {
    this.config = {
      basePath: config.basePath,
      maxDepth: config.maxDepth ?? 10,
      cache: config.cache ?? true,
    };

    this.fileReaderPromise = createFileReader(this.config.basePath);
    this.cache = new Map();
    this.includedFiles = new Set();
  }

  /**
   * Process content and resolve all #includes
   * @param content Content to process
   * @param currentFile Path of current file (for relative resolution)
   * @returns Preprocessor result
   */
  async process(
    content: string,
    currentFile = "",
  ): Promise<PreprocessorResult> {
    // Reset state
    this.includedFiles.clear();

    // Wait for fileReader to be ready
    const fileReader = await this.fileReaderPromise;

    // Process content with empty stack
    const result = await this.processContent(
      content,
      currentFile,
      0,
      fileReader,
      [],
    );

    return {
      content: result.content,
      includedFiles: Array.from(this.includedFiles),
      includes: result.includes,
      lineMap: result.lineMap,
      errors: result.errors,
    };
  }

  /**
   * Process content recursively
   * @param stack Array of file paths in current include chain (for circular detection)
   */
  private async processContent(
    content: string,
    currentFile: string,
    depth: number,
    fileReader: FileReader,
    stack: string[],
  ): Promise<ProcessResult> {
    const result: ProcessResult = {
      content: "",
      includes: [],
      lineMap: [],
      errors: [],
    };

    // Check maximum depth
    if (depth > this.config.maxDepth) {
      result.errors.push({
        type: "max_depth_exceeded",
        message: `Maximum include depth (${this.config.maxDepth}) exceeded`,
        file: currentFile,
      });
      result.content = content;
      return result;
    }

    const lines = content.split("\n");
    const outputLines: string[] = [];
    let outputLineNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line && line !== "") {
        // Handle undefined line (shouldn't happen with split, but for type safety)
        continue;
      }
      const sourceLine = i + 1;

      // Check if line contains #include (can be anywhere in the line, including in comments)
      const includeMatch = line.match(/#include\s+([^\s\n]+)/);

      if (!includeMatch) {
        // Regular line - add to output and map it
        outputLines.push(line);
        result.lineMap.push({
          outputLine: outputLineNumber,
          sourceFile: currentFile || "input",
          sourceLine,
        });
        outputLineNumber++;
        continue;
      }

      // Process include directive
      const includePath = includeMatch[1]?.trim();
      if (!includePath) {
        outputLines.push(line);
        result.lineMap.push({
          outputLine: outputLineNumber,
          sourceFile: currentFile || "input",
          sourceLine,
        });
        outputLineNumber++;
        continue;
      }

      // Resolve the path of the file to include
      const resolvedPath = fileReader.resolve(currentFile, includePath);

      // Check for circular includes
      if (stack.includes(resolvedPath)) {
        const error: PreprocessorError = {
          type: "circular_include",
          message: `Circular include detected: ${includePath} (would create infinite loop: ${[...stack, resolvedPath].join(" → ")})`,
          file: currentFile,
          line: sourceLine,
        };
        result.errors.push(error);
        // Keep the #include line in output
        outputLines.push(line);
        result.lineMap.push({
          outputLine: outputLineNumber,
          sourceFile: currentFile || "input",
          sourceLine,
        });
        outputLineNumber++;
        continue;
      }

      try {
        // Read file content
        let includedContent: string;

        if (this.config.cache) {
          const cachedContent = this.cache.get(resolvedPath);
          if (cachedContent !== undefined) {
            includedContent = cachedContent;
          } else {
            includedContent = await fileReader.read(resolvedPath);
            this.cache.set(resolvedPath, includedContent);
          }
        } else {
          includedContent = await fileReader.read(resolvedPath);
        }

        // Add to list of included files
        this.includedFiles.add(resolvedPath);

        // Recursively process included content
        const nestedResult = await this.processContent(
          includedContent,
          resolvedPath,
          depth + 1,
          fileReader,
          [...stack, resolvedPath],
        );

        // Create include entry
        const include: Include = {
          path: includePath,
          resolvedPath,
          content: includedContent,
          children: nestedResult.includes,
          depth,
        };
        result.includes.push(include);

        // Replace the #include directive in the line with the nested content
        const fullMatch = includeMatch[0]; // The full match "#include file.ext"
        const processedLine = line.replace(fullMatch, nestedResult.content);

        // If the replacement is multiline, split it up
        const replacementLines = processedLine.split("\n");

        // Add all lines from the replacement
        for (let j = 0; j < replacementLines.length; j++) {
          const replacementLine = replacementLines[j];
          if (replacementLine === undefined) continue;

          outputLines.push(replacementLine);

          // For line mapping, map the first line to the source line
          // and subsequent lines to nested content's source
          if (j === 0) {
            result.lineMap.push({
              outputLine: outputLineNumber,
              sourceFile: currentFile || "input",
              sourceLine,
            });
          } else {
            // Map to nested content
            const nestedMapIndex = j - 1;
            const nestedMap = nestedResult.lineMap[nestedMapIndex];
            if (nestedMap) {
              result.lineMap.push({
                outputLine: outputLineNumber,
                sourceFile: nestedMap.sourceFile,
                sourceLine: nestedMap.sourceLine,
              });
            } else {
              // Fallback if we don't have enough mappings
              result.lineMap.push({
                outputLine: outputLineNumber,
                sourceFile: resolvedPath,
                sourceLine: j,
              });
            }
          }
          outputLineNumber++;
        }

        // Collect nested errors
        result.errors.push(...nestedResult.errors);
      } catch (error) {
        // Handle read errors
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        result.errors.push({
          type:
            error instanceof Error && error.message.includes("fetch")
              ? "file_not_found"
              : "read_error",
          message: `Failed to include ${includePath}: ${errorMessage}`,
          file: currentFile,
          line: sourceLine,
        });

        // Keep the #include line in output on error
        outputLines.push(line);
        result.lineMap.push({
          outputLine: outputLineNumber,
          sourceFile: currentFile || "input",
          sourceLine,
        });
        outputLineNumber++;
      }
    }

    result.content = outputLines.join("\n");
    return result;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
