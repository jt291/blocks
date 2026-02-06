import type { FileReader } from './types.js';

/**
 * FileReader pour browser utilisant fetch
 * NE PAS IMPORTER fs ou path ici !
 */
export class BrowserFileReader implements FileReader {
  constructor(private basePath: string) {}
  
  async read(path: string): Promise<string> {
    const url = this.resolve('', path);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }
  
  resolve(basePath: string, includePath: string): string {
    // Handle absolute URLs (http://, https://, //)
    if (/^https?:\/\//.test(includePath) || includePath.startsWith('//')) {
      return includePath;
    }
    
    // Handle absolute paths (starting with /)
    if (includePath.startsWith('/')) {
      return includePath;
    }
    
    // Handle relative paths
    const baseDir = basePath ? this.getDirectory(basePath) : this.basePath;
    return this.normalizePath(baseDir, includePath);
  }
  
  private getDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
  }
  
  private normalizePath(base: string, relative: string): string {
    // Combine base and relative paths
    const combined = base ? `${base}/${relative}` : relative;
    
    // Split into parts
    const parts = combined.split('/').filter(p => p !== '');
    const result: string[] = [];
    
    // Track if path was absolute
    const isAbsolute = combined.startsWith('/');
    
    // Process path parts
    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.') {
        result.push(part);
      }
    }
    
    // Reconstruct path, preserving absolute/relative nature
    const normalized = result.join('/');
    return isAbsolute ? '/' + normalized : normalized;
  }
}
