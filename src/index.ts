import { createLexer } from './lexer/lexer.js';
import { createParser } from './parser/parser.js';
import type { DocumentNode } from './parser/ast.js';

export * from './parser/ast.js';
export * from './lexer/tokens.js';
export * from './lexer/lexer.js';
export * from './parser/parser.js';

export interface ParseResult {
  ast: DocumentNode;
  errors: string[];
}

export function parse(input: string): ParseResult {
  try {
    // Tokenize
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(input);

    // Parse
    const parser = createParser();
    parser.input = tokens;
    const children = parser.document();

    const errors: string[] = [];
    if (parser.errors.length > 0) {
      errors.push(...parser.errors.map(e => e.message));
    }

    const ast: DocumentNode = {
      type: 'Document',
      children
    };

    return { ast, errors };
  } catch (error) {
    return {
      ast: { type: 'Document', children: [] },
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}
