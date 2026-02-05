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
          content: mergeTextNodes(genericInline.content as (BlockNode | InlineNode | TextNode)[]) as InlineNode[]
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
      errors.push(...parser.errors.map(e => e.message));
    }

    const ast: DocumentNode = {
      type: 'Document',
      children
    };

    // Merge consecutive Text nodes
    const mergedAst = mergeTextNodesInAST(ast);

    return { ast: mergedAst, errors };
  } catch (error) {
    return {
      ast: { type: 'Document', children: [] },
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}
