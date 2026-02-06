import type { FileReader } from "./types.js";

/**
 * Détecte si on est dans un environnement browser
 */
function isBrowser(): boolean {
  // Si on a process.versions.node, on est dans Node
  try {
    return typeof process === 'undefined' || !process.versions?.node;
  } catch {
    return true; // Si process n'existe pas, on est dans le browser
  }
}

/**
 * Créer un FileReader adapté à l'environnement
 * 
 * Cette fonction fait un import dynamique pour éviter que Vite
 * ne bundle le code Node.js dans le bundle browser.
 */
export async function createFileReader(basePath: string): Promise<FileReader> {
  if (isBrowser()) {
    // Import dynamique du module browser
    const { BrowserFileReader } = await import('./io-browser.js');
    return new BrowserFileReader(basePath);
  }
  // Import dynamique du module Node
  const { NodeFileReader } = await import('./io-node.js');
  return new NodeFileReader(basePath);
}
