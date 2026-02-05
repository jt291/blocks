import type { IToken } from "chevrotain";
import { createLexer } from "./lexer/lexer.js";
import type {
  BlockNode,
  DocumentNode,
  GenericBlockNode,
  GenericInlineNode,
  InlineNode,
  TextNode,
} from "./parser/ast.js";
import { createParser } from "./parser/parser.js";

export * from "./lexer/lexer.js";
export * from "./lexer/tokens.js";
export * from "./parser/ast.js";
export * from "./parser/parser.js";
export * from "./preprocessor/index.js";

export interface ParseResult {
  ast: DocumentNode;
  errors: string[];
}

/**
 * Extended error type for Chevrotain parser errors with additional properties
 */
interface ChevrotainParserError {
  token?: IToken;
  previousToken?: IToken;
  message?: string;
}

/**
 * Merge consecutive Text nodes into single nodes
 */
function mergeTextNodes(
  nodes: (BlockNode | InlineNode | TextNode)[],
): (BlockNode | InlineNode | TextNode)[] {
  const merged: (BlockNode | InlineNode | TextNode)[] = [];
  let currentText = "";

  for (const node of nodes) {
    if (node.type === "Text") {
      // Accumulate text
      currentText += (node as TextNode).value;
    } else {
      // Flush accumulated text
      if (currentText) {
        merged.push({ type: "Text", value: currentText });
        currentText = "";
      }

      // Process nested content if it exists
      if (node.type === "GenericBlock") {
        const genericBlock = node as GenericBlockNode;
        merged.push({
          ...genericBlock,
          content: mergeTextNodes(genericBlock.content),
        });
      } else if (node.type === "GenericInline") {
        const genericInline = node as GenericInlineNode;
        merged.push({
          ...genericInline,
          content: mergeTextNodes(genericInline.content) as (
            | InlineNode
            | TextNode
          )[],
        });
      } else {
        merged.push(node);
      }
    }
  }

  // Flush remaining text
  if (currentText) {
    merged.push({ type: "Text", value: currentText });
  }

  return merged;
}

/**
 * Merge text nodes in the entire AST
 */
function mergeTextNodesInAST(ast: DocumentNode): DocumentNode {
  return {
    ...ast,
    children: mergeTextNodes(ast.children),
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
      // Process Chevrotain errors with better formatting
      for (const e of parser.errors) {
        try {
          if (typeof e === "string") {
            errors.push(e);
          } else if (e && typeof e === "object") {
            // Extract token information for better error messages
            const errorObj = e as ChevrotainParserError;
            const token = errorObj.token;
            const previousToken = errorObj.previousToken;
            const message = errorObj.message || "";

            // Use previous token if current token has NaN line (EOF case)
            const lineInfo =
              token &&
              typeof token.startLine === "number" &&
              !Number.isNaN(token.startLine)
                ? token
                : previousToken;

            if (
              lineInfo &&
              typeof lineInfo.startLine === "number" &&
              !Number.isNaN(lineInfo.startLine)
            ) {
              // Format error with line number
              let errorMsg = `Parse error at line ${lineInfo.startLine}`;

              // Try to make the error message more specific based on what was expected
              if (message.includes("BlockCodeDelim")) {
                errorMsg += ": Expected closing backticks for code block";
              } else if (message.includes("BlockScriptDelim")) {
                errorMsg +=
                  ": Expected closing exclamation marks for script block";
              } else if (message.includes("BlockCommentEnd")) {
                errorMsg += ": Expected closing */ for comment block";
              } else if (message.includes("InlineCodeDelim")) {
                errorMsg += ": Expected closing backtick (`) for inline code";
              } else if (message.includes("InlineScriptDelim")) {
                errorMsg +=
                  ": Expected closing exclamation mark (!) for inline script";
              } else if (message.includes("InlineGenericDelim")) {
                errorMsg += ": Expected closing colon (:) for inline generic";
              } else if (message) {
                errorMsg += `: ${message}`;
              }

              errors.push(errorMsg);
            } else {
              // Fallback if no line info
              errors.push(String(message || "Parse error occurred"));
            }
          } else {
            errors.push(String(e));
          }
        } catch (_errExtract) {
          // If error extraction fails, provide a helpful message
          errors.push(
            "Parser error occurred but could not extract error message",
          );
        }
      }
    }

    // If children is undefined (happens when parser encountered error), use empty array
    const childrenArray = children || [];

    const ast: DocumentNode = {
      type: "Document",
      children: childrenArray,
    };

    // Merge consecutive Text nodes only if we have valid children
    const mergedAst = childrenArray.length > 0 ? mergeTextNodesInAST(ast) : ast;

    return { ast: mergedAst, errors };
  } catch (error) {
    // Handle thrown errors (like delimiter length mismatches)
    let errorMessage = "Unknown parsing error";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    return {
      ast: { type: "Document", children: [] },
      errors: [errorMessage],
    };
  }
}
