/**
 * Configuration du préprocesseur
 */
export interface PreprocessorConfig {
  /**
   * Chemin de base pour la résolution des fichiers
   * - Browser: '/public/' ou '/assets/'
   * - Node: './content/' ou chemin absolu
   */
  basePath: string;

  /**
   * Profondeur maximale d'inclusion pour éviter les boucles infinies
   * @default 10
   */
  maxDepth?: number;

  /**
   * Activer le cache des fichiers inclus
   * @default true
   */
  cache?: boolean;
}

/**
 * Résultat du préprocesseur
 */
export interface PreprocessorResult {
  /**
   * Contenu après traitement des includes
   */
  content: string;

  /**
   * Liste des fichiers inclus (pour le debug)
   */
  includedFiles: string[];

  /**
   * Erreurs rencontrées (non-bloquantes si configuré)
   */
  errors: PreprocessorError[];
}

/**
 * Erreur du préprocesseur
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
 * Interface pour lire des fichiers (abstraction fetch/fs)
 */
export interface FileReader {
  /**
   * Lire un fichier
   * @param path Chemin du fichier (peut être relatif ou absolu)
   * @returns Contenu du fichier en string
   */
  read(path: string): Promise<string>;

  /**
   * Résoudre un chemin relatif par rapport à un fichier de base
   * @param basePath Chemin du fichier qui contient l'include
   * @param includePath Chemin dans la directive #include
   * @returns Chemin résolu
   */
  resolve(basePath: string, includePath: string): string;
}
