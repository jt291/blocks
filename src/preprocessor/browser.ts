/**
 * Browser-only entry point for the preprocessor
 * This file ensures only browser-compatible code is bundled
 */

export { Preprocessor } from './preprocessor.js';
export { BrowserFileReader } from './io-browser.js';
export { createFileReader } from './io.js';
export type { PreprocessorConfig, PreprocessorResult, PreprocessorError, FileReader } from './types.js';
