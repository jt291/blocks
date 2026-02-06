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
    // Dans le browser, utiliser manipulation de strings pour résoudre les chemins
    if (includePath.startsWith('/')) {
      // Chemin absolu
      return includePath;
    }
    
    // Chemin relatif
    const baseDir = basePath ? this.getDirectory(basePath) : this.basePath;
    return this.normalizePath(baseDir + '/' + includePath);
  }
  
  private getDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
  }
  
  private normalizePath(path: string): string {
    // Résoudre les '..' et '.'
    const parts = path.split('/').filter(p => p !== '');
    const result: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.') {
        result.push(part);
      }
    }
    
    return '/' + result.join('/');
  }
}
