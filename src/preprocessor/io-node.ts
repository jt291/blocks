import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { FileReader } from './types.js';

/**
 * FileReader pour Node.js utilisant fs
 */
export class NodeFileReader implements FileReader {
  constructor(private basePath: string) {}
  
  async read(filePath: string): Promise<string> {
    const resolvedPath = this.resolve('', filePath);
    return await fs.readFile(resolvedPath, 'utf-8');
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
