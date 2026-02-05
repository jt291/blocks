import { createFileReader } from "./io.js";
import type {
  FileReader,
  PreprocessorConfig,
  PreprocessorError,
  PreprocessorResult,
} from "./types.js";

/**
 * Préprocesseur pour traiter les directives #include
 */
export class Preprocessor {
  private config: Required<PreprocessorConfig>;
  private fileReader: FileReader;
  private cache: Map<string, string>;
  private includedFiles: Set<string>;
  private errors: PreprocessorError[];

  constructor(config: PreprocessorConfig) {
    this.config = {
      basePath: config.basePath,
      maxDepth: config.maxDepth ?? 10,
      cache: config.cache ?? true,
    };

    this.fileReader = createFileReader(this.config.basePath);
    this.cache = new Map();
    this.includedFiles = new Set();
    this.errors = [];
  }

  /**
   * Traite le contenu et résout tous les #include
   * @param content Contenu à traiter
   * @param currentFile Chemin du fichier actuel (pour la résolution relative)
   * @returns Résultat du préprocesseur
   */
  async process(
    content: string,
    currentFile = "",
  ): Promise<PreprocessorResult> {
    // Réinitialiser l'état
    this.includedFiles.clear();
    this.errors = [];

    // Traiter le contenu
    const processedContent = await this.processContent(content, currentFile, 0);

    return {
      content: processedContent,
      includedFiles: Array.from(this.includedFiles),
      errors: this.errors,
    };
  }

  /**
   * Traite le contenu de manière récursive
   */
  private async processContent(
    content: string,
    currentFile: string,
    depth: number,
  ): Promise<string> {
    // Vérifier la profondeur maximale
    if (depth > this.config.maxDepth) {
      this.errors.push({
        type: "max_depth_exceeded",
        message: `Maximum include depth (${this.config.maxDepth}) exceeded`,
        file: currentFile,
      });
      return content;
    }

    // Pattern pour détecter les directives #include
    // Peut apparaître dans des commentaires ou directement dans le code
    const includePattern = /#include\s+([^\s\n]+)/g;

    let result = content;
    const matches = Array.from(content.matchAll(includePattern));

    // Traiter chaque #include trouvé
    for (const match of matches) {
      const includePath = match[1];
      if (!includePath) {
        continue;
      }
      const fullMatch = match[0];

      // Résoudre le chemin du fichier à inclure
      const resolvedPath = this.fileReader.resolve(currentFile, includePath);

      // Vérifier les includes circulaires
      if (this.includedFiles.has(resolvedPath)) {
        this.errors.push({
          type: "circular_include",
          message: `Circular include detected: ${resolvedPath}`,
          file: currentFile,
        });
        continue;
      }

      try {
        // Lire le contenu du fichier
        let includedContent: string;

        if (this.config.cache && this.cache.has(resolvedPath)) {
          includedContent = this.cache.get(resolvedPath)!;
        } else {
          includedContent = await this.fileReader.read(resolvedPath);

          if (this.config.cache) {
            this.cache.set(resolvedPath, includedContent);
          }
        }

        // Ajouter à la liste des fichiers inclus
        this.includedFiles.add(resolvedPath);

        // Traiter récursivement le contenu inclus
        const processedIncluded = await this.processContent(
          includedContent,
          resolvedPath,
          depth + 1,
        );

        // Remplacer la directive #include par le contenu
        result = result.replace(fullMatch, processedIncluded);
      } catch (error) {
        // Gérer les erreurs de lecture
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
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
