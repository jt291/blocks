import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileReader } from "./types.js";

/**
 * Detects if we're in a browser environment
 */
function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    "window" in globalThis &&
    typeof fetch !== "undefined"
  );
}

/**
 * FileReader for browser using fetch
 */
class BrowserFileReader implements FileReader {
  constructor(private basePath: string) {}

  async read(path: string): Promise<string> {
    const url = this.resolve("", path);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  }

  resolve(basePath: string, includePath: string): string {
    // In browser, use URL to resolve paths
    if (includePath.startsWith("/")) {
      // Absolute path
      return includePath;
    }

    // Relative path
    const baseDir = basePath ? this.getDirectory(basePath) : this.basePath;
    return this.normalizePath(`${baseDir}/${includePath}`);
  }

  private getDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : "";
  }

  private normalizePath(path: string): string {
    // Resolve '..' and '.'
    const parts = path.split("/").filter((p) => p !== "");
    const result: string[] = [];

    for (const part of parts) {
      if (part === "..") {
        result.pop();
      } else if (part !== ".") {
        result.push(part);
      }
    }

    return `/${result.join("/")}`;
  }
}

/**
 * FileReader for Node.js using fs
 */
class NodeFileReader implements FileReader {
  constructor(private basePath: string) {}

  async read(filePath: string): Promise<string> {
    const resolvedPath = this.resolve("", filePath);
    return await fs.readFile(resolvedPath, "utf-8");
  }

  resolve(basePath: string, includePath: string): string {
    // In Node, use path.resolve
    if (path.isAbsolute(includePath)) {
      return includePath;
    }

    const baseDir = basePath ? path.dirname(basePath) : this.basePath;
    return path.resolve(baseDir, includePath);
  }
}

/**
 * Create a FileReader appropriate for the environment
 */
export function createFileReader(basePath: string): FileReader {
  if (isBrowser()) {
    return new BrowserFileReader(basePath);
  }
  return new NodeFileReader(basePath);
}
