/**
 * Preprocessor configuration
 */
export interface PreprocessorConfig {
  /**
   * Base path for file resolution
   * - Browser: '/public/' or '/assets/'
   * - Node: './content/' or absolute path
   */
  basePath: string;

  /**
   * Maximum include depth to prevent infinite loops
   * @default 10
   */
  maxDepth?: number;

  /**
   * Enable file caching
   * @default true
   */
  cache?: boolean;
}

/**
 * Preprocessor result
 */
export interface PreprocessorResult {
  /**
   * Content after processing includes
   */
  content: string;

  /**
   * List of included files (for debugging)
   */
  includedFiles: string[];

  /**
   * Errors encountered (non-blocking if configured)
   */
  errors: PreprocessorError[];
}

/**
 * Preprocessor error
 */
export interface PreprocessorError {
  type:
    | "file_not_found"
    | "circular_include"
    | "max_depth_exceeded"
    | "read_error";
  message: string;
  file: string;
  line?: number;
}

/**
 * Interface for reading files (fetch/fs abstraction)
 */
export interface FileReader {
  /**
   * Read a file
   * @param path File path (can be relative or absolute)
   * @returns File content as string
   */
  read(path: string): Promise<string>;

  /**
   * Resolve a relative path based on a base file
   * @param basePath Path of file containing the include
   * @param includePath Path in the #include directive
   * @returns Resolved path
   */
  resolve(basePath: string, includePath: string): string;
}
