import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileReader } from "./types.js";

/**
 * Détecte si on est dans un environnement browser
 */
function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    "window" in globalThis &&
    typeof fetch !== "undefined"
  );
}

/**
 * FileReader pour browser utilisant fetch
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
    // Dans le browser, utiliser URL pour résoudre les chemins
    if (includePath.startsWith("/")) {
      // Chemin absolu
      return includePath;
    }

    // Chemin relatif
    const baseDir = basePath ? this.getDirectory(basePath) : this.basePath;
    return this.normalizePath(`${baseDir}/${includePath}`);
  }

  private getDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : "";
  }

  private normalizePath(path: string): string {
    // Résoudre les '..' et '.'
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
 * FileReader pour Node.js utilisant fs
 */
class NodeFileReader implements FileReader {
  constructor(private basePath: string) {}

  async read(filePath: string): Promise<string> {
    const resolvedPath = this.resolve("", filePath);
    return await fs.readFile(resolvedPath, "utf-8");
  }

  resolve(basePath: string, includePath: string): string {
    // Dans Node, utiliser path.resolve
    if (path.isAbsolute(includePath)) {
      return includePath;
    }

    const baseDir = basePath ? path.dirname(basePath) : this.basePath;
    return path.resolve(baseDir, includePath);
  }
}

/**
 * Créer un FileReader adapté à l'environnement
 */
export function createFileReader(basePath: string): FileReader {
  if (isBrowser()) {
    return new BrowserFileReader(basePath);
  }
  return new NodeFileReader(basePath);
}
