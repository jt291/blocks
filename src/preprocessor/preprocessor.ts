import { createFileReader } from "./io.js";
import type {
  FileReader,
  PreprocessorConfig,
  PreprocessorError,
  PreprocessorResult,
} from "./types.js";

/**
 * Preprocessor for handling #include directives
 */
export class Preprocessor {
  private config: Required<PreprocessorConfig>;
  private fileReaderPromise: Promise<FileReader>;
  private cache: Map<string, string>;
  private includedFiles: Set<string>;
  private errors: PreprocessorError[];

  constructor(config: PreprocessorConfig) {
    this.config = {
      basePath: config.basePath,
      maxDepth: config.maxDepth ?? 10,
      cache: config.cache ?? true,
    };

    this.fileReaderPromise = createFileReader(this.config.basePath);
    this.cache = new Map();
    this.includedFiles = new Set();
    this.errors = [];
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
    this.errors = [];

    // Wait for fileReader to be ready
    const fileReader = await this.fileReaderPromise;

    // Process content
    const processedContent = await this.processContent(
      content,
      currentFile,
      0,
      fileReader,
    );

    return {
      content: processedContent,
      includedFiles: Array.from(this.includedFiles),
      errors: this.errors,
    };
  }

  /**
   * Process content recursively
   */
  private async processContent(
    content: string,
    currentFile: string,
    depth: number,
    fileReader: FileReader,
  ): Promise<string> {
    // Check maximum depth
    if (depth > this.config.maxDepth) {
      this.errors.push({
        type: "max_depth_exceeded",
        message: `Maximum include depth (${this.config.maxDepth}) exceeded`,
        file: currentFile,
      });
      return content;
    }

    // Pattern to detect #include directives
    // Can appear in comments or directly in code
    const includePattern = /#include\s+([^\s\n]+)/g;

    let result = content;
    const matches = Array.from(content.matchAll(includePattern));

    // Process each #include found
    for (const match of matches) {
      const includePath = match[1];
      if (!includePath) {
        continue;
      }
      const fullMatch = match[0];

      // Resolve the path of the file to include
      const resolvedPath = fileReader.resolve(currentFile, includePath);

      // Check for circular includes
      if (this.includedFiles.has(resolvedPath)) {
        this.errors.push({
          type: "circular_include",
          message: `Circular include detected: ${resolvedPath}`,
          file: currentFile,
        });
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
            // Cache miss - read file and cache it
            includedContent = await fileReader.read(resolvedPath);
            this.cache.set(resolvedPath, includedContent);
          }
        } else {
          includedContent = await fileReader.read(resolvedPath);
        }

        // Add to list of included files
        this.includedFiles.add(resolvedPath);

        // Recursively process included content
        const processedIncluded = await this.processContent(
          includedContent,
          resolvedPath,
          depth + 1,
          fileReader,
        );

        // Replace the #include directive with content
        result = result.replace(fullMatch, processedIncluded);
      } catch (error) {
        // Handle read errors
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        this.errors.push({
          type:
            error instanceof Error && error.message.includes("fetch")
              ? "file_not_found"
              : "read_error",
          message: `Failed to include ${includePath}: ${errorMessage}`,
          file: currentFile,
        });
      }
    }

    return result;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
