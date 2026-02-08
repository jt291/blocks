/**
 * Parser wrapper for backwards compatibility
 * 
 * The EmbeddedActionsParser directly returns AST nodes,
 * so no CST-to-AST visitor is needed.
 */

import type { IToken } from "chevrotain";
import type { DocumentNode } from "./ast.js";
import { createParser } from "./parser.js";

/**
 * Parse tokens into AST
 * 
 * This function provides backwards compatibility.
 * The parser now uses Embedded Actions and returns AST directly.
 */
export function parse(tokens: IToken[]): DocumentNode {
  const parser = createParser();
  
  parser.input = tokens;
  const ast = parser.document();

  if (parser.errors.length > 0) {
    throw new Error(
      `Parse errors: ${parser.errors.map((e) => e.message).join(", ")}`
    );
  }

  return {
    type: "Document",
    children: ast,
  };
}
