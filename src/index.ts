import { createLexer } from './lexer/lexer.js';
import { createParser } from './parser/parser.js';
import type { DocumentNode, BlockNode, InlineNode, TextNode, GenericBlockNode, GenericInlineNode } from './parser/ast.js';

export * from './parser/ast.js';
export * from './lexer/tokens.js';
export * from './lexer/lexer.js';
export * from './parser/parser.js';

export interface ParseResult {
  ast: DocumentNode;
  errors: string[];
}

/**
 * Merge consecutive Text nodes into single nodes
 */
function mergeTextNodes(nodes: (BlockNode | InlineNode | TextNode)[]): (BlockNode | InlineNode | TextNode)[] {
  const merged: (BlockNode | InlineNode | TextNode)[] = [];
  let currentText = '';
  
  for (const node of nodes) {
    if (node.type === 'Text') {
      // Accumulate text
      currentText += (node as TextNode).value;
    } else {
      // Flush accumulated text
      if (currentText) {
        merged.push({ type: 'Text', value: currentText });
        currentText = '';
      }
      
      // Process nested content if it exists
      if (node.type === 'GenericBlock') {
        const genericBlock = node as GenericBlockNode;
        merged.push({
          ...genericBlock,
          content: mergeTextNodes(genericBlock.content)
        });
      } else if (node.type === 'GenericInline') {
        const genericInline = node as GenericInlineNode;
        merged.push({
          ...genericInline,
          content: mergeTextNodes(genericInline.content) as (InlineNode | TextNode)[]
        });
      } else {
        merged.push(node);
      }
    }
  }
  
  // Flush remaining text
  if (currentText) {
    merged.push({ type: 'Text', value: currentText });
  }
  
  return merged;
}

/**
 * Merge text nodes in the entire AST
 */
function mergeTextNodesInAST(ast: DocumentNode): DocumentNode {
  return {
    ...ast,
    children: mergeTextNodes(ast.children)
  };
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
      // Safely extract error messages, handling various error formats
      for (const e of parser.errors) {
        try {
          if (typeof e === 'string') {
            errors.push(e);
          } else if (e && typeof e === 'object') {
            // Try to get message from error object
            const message = (e as any).message || JSON.stringify(e);
            errors.push(String(message));
          } else {
            errors.push(String(e));
          }
        } catch (errExtract) {
          // If error extraction fails, provide a helpful message
          errors.push('Parser error occurred but could not extract error message');
        }
      }
    }

    const ast: DocumentNode = {
      type: 'Document',
      children
    };

    // Merge consecutive Text nodes
    const mergedAst = mergeTextNodesInAST(ast);

    return { ast: mergedAst, errors };
  } catch (error) {
    // Provide better error messages for common parsing issues
    let errorMessage = 'Unknown parsing error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common error patterns and provide helpful messages
      if (errorMessage.includes('not iterable') || errorMessage.includes('undefined') || errorMessage.includes('not an object')) {
        // This often indicates an unclosed delimiter or length mismatch
        errorMessage = 'Parsing error: Unclosed or mismatched delimiter detected. Common issues:\n' +
          '  - Code block: Missing closing ``` or different number of backticks\n' +
          '  - Script block: Missing closing !!! or different number of exclamation marks\n' +
          '  - Generic block: Missing closing ::: or different number of colons\n' +
          '  - Inline code: Missing closing `\n' +
          '  - Inline script: Missing closing !\n' +
          '  - Inline generic: Missing closing :';
      }
    } else {
      errorMessage = String(error);
    }
    
    return {
      ast: { type: 'Document', children: [] },
      errors: [errorMessage]
    };
  }
}


