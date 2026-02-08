import { EmbeddedActionsParser, type IToken } from "chevrotain";
import * as tokens from "../lexer/tokens.js";
import type {
  Attributes,
  BlockNode,
  CodeBlockNode,
  CodeInlineNode,
  CommentBlockNode,
  CommentInlineNode,
  GenericBlockNode,
  GenericInlineNode,
  InlineNode,
  ScriptNode,
  TextNode,
} from "./ast.js";

/**
 * Helper function to get line number from token
 * Chevrotain uses 1-based line numbers
 */
function getLineNumber(token: IToken | undefined): number | string {
  if (!token || token.startLine === undefined) {
    return "unknown";
  }
  // Chevrotain uses 1-based line numbering by default
  return token.startLine;
}

/**
 * Helper function to process token image for escaped tokens
 * Removes the backslash from escaped tokens
 */
function processTokenImage(tok: IToken): string {
  // Check if this is an escaped token (token name starts with "Escaped")
  const typeName = tok.tokenType?.name;
  if (typeName?.startsWith("Escaped")) {
    // Remove the leading backslash to get the literal character
    return tok.image.substring(1);
  }
  // For all other tokens, return the image as-is
  return tok.image;
}



export class BlocksParser extends EmbeddedActionsParser {
  constructor() {
    super(tokens.allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: "full",
    });
    this.performSelfAnalysis();
  }

  // Main document rule
  public document = this.RULE(
    "document",
    (): (BlockNode | InlineNode | ScriptNode | TextNode)[] => {
      const children: (BlockNode | InlineNode | ScriptNode | TextNode)[] = [];

      this.MANY(() => {
        const child = this.OR([
          { ALT: () => this.SUBRULE(this.blockElement) },
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.scriptExpression) },
          {
            GATE: () => {
              // Only parse as text if it's NOT an inline element pattern
              const la1 = this.LA(1);
              const la2 = this.LA(2);
              
              // Don't consume if it matches inline patterns
              if (la1.tokenType === tokens.Identifier) {
                if (la2.tokenType === tokens.Backtick || la2.tokenType === tokens.Colon) {
                  return false; // Let inlineElement handle it
                }
              }
              if (la1.tokenType === tokens.InlineCommentStart) {
                return false; // Let inlineElement handle it
              }
              
              return true; // Parse as text
            },
            ALT: () => this.SUBRULE(this.textElement)
          },
        ]);
        if (child) children.push(child);
      });

      return children;
    },
  );

  // Block elements
  private blockElement = this.RULE("blockElement", (): BlockNode => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.commentBlock) },
      { ALT: () => this.SUBRULE(this.codeBlock) },
      { ALT: () => this.SUBRULE(this.genericBlock) },
    ]);
  });

  // Comment block: /* content */
  // No name support in v1.0 spec
  private commentBlock = this.RULE("commentBlock", (): CommentBlockNode => {
    this.CONSUME(tokens.BlockCommentStart);

    // Consume all content until */
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.ScriptExprStart) },
        // Escaped tokens
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.EscapedDot) },
        { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Individual delimiters
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
        { ALT: () => this.CONSUME(tokens.LBracket) },
        { ALT: () => this.CONSUME(tokens.RBracket) },
        { ALT: () => this.CONSUME(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.At) },
        { ALT: () => this.CONSUME(tokens.Question) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    this.CONSUME(tokens.BlockCommentEnd);

    const node: CommentBlockNode = {
      type: "CommentBlock",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    return node;
  });

  // Code block: ``` language [attrs] content ```
  // Language is required, no # prefix
  private codeBlock = this.RULE("codeBlock", (): CodeBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockCodeDelim);
    const openDelimLength = openDelim.image.length;

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    // Consume language name (required)
    const nameToken = this.CONSUME(tokens.Identifier);
    const name = nameToken.image;

    if (!name || name.trim() === "") {
      throw new Error("Code block language name is required");
    }

    // Skip whitespace after name
    this.MANY2(() => {
      this.CONSUME2(tokens.Whitespace);
    });

    // Try to consume attributes
    let attributes: Attributes | undefined;
    this.OPTION(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
      ]);
    });

    // Consume all content until matching ```
    const contentTokens: IToken[] = [];
    this.MANY4(() => {
      const tok = this.OR2([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME4(tokens.Whitespace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.ScriptExprStart) },
        // Escaped tokens
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.EscapedDot) },
        { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Individual delimiters
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
        { ALT: () => this.CONSUME(tokens.LBracket) },
        { ALT: () => this.CONSUME(tokens.RBracket) },
        { ALT: () => this.CONSUME(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.At) },
        { ALT: () => this.CONSUME(tokens.Question) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    const closeDelim = this.CONSUME2(tokens.BlockCodeDelim);
    const closeLength = closeDelim.image.length;

    // Verify exact length match
    if (openDelimLength !== closeLength) {
      const closeLine = getLineNumber(closeDelim);
      const openLine = getLineNumber(openDelim);
      throw new Error(
        `Code block closing delimiter length mismatch: expected ${openDelimLength} backtick${openDelimLength > 1 ? "s" : ""} but got ${closeLength} at line ${closeLine} (opened at line ${openLine})`,
      );
    }

    const node: CodeBlockNode = {
      type: "CodeBlock",
      name,
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (attributes) node.attributes = attributes;

    return node;
  });

  // Script expression: ${ content }
  private scriptExpression = this.RULE("scriptExpression", (): ScriptNode => {
    this.CONSUME(tokens.ScriptExprStart);

    // Consume all content until }
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        // Escaped tokens
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.EscapedDot) },
        { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Individual delimiters
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.LBracket) },
        { ALT: () => this.CONSUME(tokens.RBracket) },
        { ALT: () => this.CONSUME(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.At) },
        { ALT: () => this.CONSUME(tokens.Question) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    this.CONSUME(tokens.ScriptExprEnd);

    const node: ScriptNode = {
      type: "Script",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    return node;
  });

  // Generic block: :::name [attrs] content :::
  // Name is required, no # prefix
  private genericBlock = this.RULE("genericBlock", (): GenericBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockGenericDelim);
    const delimLength = openDelim.image.length;

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    // APRÈS (optionnel)
    let name: string | undefined;
    this.OPTION(() => {
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
    });

    // Skip whitespace after name
    this.MANY2(() => {
      this.CONSUME2(tokens.Whitespace);
    });

    // Try to consume attributes
    let attributes: Attributes | undefined;
    this.OPTION(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
      ]);
    });

    // Parse content (can contain blocks, inlines, and script expressions)
    const content: (BlockNode | InlineNode | ScriptNode | TextNode)[] = [];
    this.MANY4({
      GATE: () => {
        // Continue parsing until we find a closing delimiter of EXACTLY the same length
        if (this.LA(1).tokenType === tokens.BlockGenericDelim) {
          const nextDelim = this.LA(1) as IToken;
          return nextDelim.image.length !== delimLength;
        }
        return true;
      },
      DEF: () => {
        const child = this.OR2([
          { ALT: () => this.SUBRULE(this.blockElement) },
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.scriptExpression) },
          {
            GATE: () => {
              // Only parse as text if it's NOT an inline element pattern
              const la1 = this.LA(1);
              const la2 = this.LA(2);
              
              // Don't consume if it matches inline patterns
              if (la1.tokenType === tokens.Identifier) {
                if (la2.tokenType === tokens.Backtick || la2.tokenType === tokens.Colon) {
                  return false; // Let inlineElement handle it
                }
              }
              if (la1.tokenType === tokens.InlineCommentStart) {
                return false; // Let inlineElement handle it
              }
              
              return true; // Parse as text
            },
            ALT: () => this.SUBRULE(this.textElement)
          },
        ]);
        if (child) content.push(child);
      },
    });

    const closeDelim = this.CONSUME2(tokens.BlockGenericDelim);

    // Verify exact length match
    if (closeDelim.image.length !== delimLength) {
      throw new Error(
        `Generic block closing delimiter length mismatch: expected ${delimLength} colons but got ${closeDelim.image.length}`,
      );
    }

    const node: GenericBlockNode = {
      type: "GenericBlock",
      name,
      content,
    };

    if (attributes) node.attributes = attributes;

    return node;
  });

  // Inline elements
  private inlineElement = this.RULE("inlineElement", (): InlineNode => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.commentInline) },
      { ALT: () => this.SUBRULE(this.codeInline) },
      { ALT: () => this.SUBRULE(this.genericInline) },
    ]);
  });

  // Comment inline: // content\n
  // No name support in v1.0 spec
  private commentInline = this.RULE("commentInline", (): CommentInlineNode => {
    this.CONSUME(tokens.InlineCommentStart);

    // Consume all content until newline or EOF
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprStart) },
        // Escaped tokens
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.EscapedDot) },
        { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Individual delimiters
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
        { ALT: () => this.CONSUME(tokens.LBracket) },
        { ALT: () => this.CONSUME(tokens.RBracket) },
        { ALT: () => this.CONSUME(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.At) },
        { ALT: () => this.CONSUME(tokens.Question) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    this.OPTION(() => this.CONSUME(tokens.Newline));

    const node: CommentInlineNode = {
      type: "CommentInline",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    return node;
  });

  // Code inline: name`content`[attrs?]
  // Name is REQUIRED
  private codeInline = this.RULE("codeInline", (): CodeInlineNode => {
    // Consume name (required)
    const nameToken = this.CONSUME(tokens.Identifier);
    const name = nameToken.image;

    if (!name || name.trim() === "") {
      throw new Error("Inline code name is required");
    }

    // Consume opening backtick
    this.CONSUME(tokens.InlineCodeDelim);

    // Consume content until closing backtick
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprStart) },
        // Escaped tokens
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.EscapedDot) },
        { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Other delimiters (not backtick)
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
        { ALT: () => this.CONSUME(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.At) },
        { ALT: () => this.CONSUME(tokens.Question) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    // Consume closing backtick
    this.CONSUME2(tokens.InlineCodeDelim);

    // Try to consume attributes [...]
    let attributes: Attributes | undefined;
    this.OPTION(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    const node: CodeInlineNode = {
      type: "CodeInline",
      name,
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (attributes) node.attributes = attributes;

    return node;
  });

  // Generic inline: name:content[attrs?]
  // Name is REQUIRED, content ends at first unescaped [ or whitespace/newline
  private genericInline = this.RULE("genericInline", (): GenericInlineNode => {
    // Consume name (required)
    const nameToken = this.CONSUME(tokens.Identifier);
    const name = nameToken.image;

    if (!name || name.trim() === "") {
      throw new Error("Inline generic name is required");
    }

    // Consume colon separator
    this.CONSUME(tokens.InlineGenericDelim);

    // Consume content until [ or whitespace/newline
    const contentTokens: IToken[] = [];
    this.MANY({
      GATE: () => {
        // Stop at [ (attributes) or whitespace/newline
        const next = this.LA(1);
        return (
          next.tokenType !== tokens.LBracket &&
          next.tokenType !== tokens.Whitespace &&
          next.tokenType !== tokens.Newline
        );
      },
      DEF: () => {
        const tok = this.OR([
          { ALT: () => this.CONSUME2(tokens.Identifier) },
          { ALT: () => this.CONSUME(tokens.Content) },
          { ALT: () => this.CONSUME(tokens.ScriptExprStart) },
          // Escaped tokens
          { ALT: () => this.CONSUME(tokens.EscapedHash) },
          { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
          { ALT: () => this.CONSUME(tokens.EscapedColon) },
          { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
          { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
          { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
          { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
          { ALT: () => this.CONSUME(tokens.EscapedDash) },
          { ALT: () => this.CONSUME(tokens.EscapedDollar) },
          { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
          { ALT: () => this.CONSUME(tokens.EscapedDot) },
          { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
          { ALT: () => this.CONSUME(tokens.Backslash) },
          // Other delimiters
          { ALT: () => this.CONSUME2(tokens.InlineGenericDelim) },
          { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
          { ALT: () => this.CONSUME(tokens.LBrace) },
          { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
          { ALT: () => this.CONSUME(tokens.RBracket) },
          { ALT: () => this.CONSUME(tokens.Hash) },
          { ALT: () => this.CONSUME(tokens.Dot) },
          { ALT: () => this.CONSUME(tokens.At) },
          { ALT: () => this.CONSUME(tokens.Question) },
          { ALT: () => this.CONSUME(tokens.Percent) },
          { ALT: () => this.CONSUME(tokens.Equals) },
          { ALT: () => this.CONSUME(tokens.StringValue) },
          { ALT: () => this.CONSUME(tokens.AnyChar) },
          { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
          { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
          { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
          { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
          { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
        ]);
        if (tok) contentTokens.push(tok);
      },
    });

    // Try to consume attributes [...]
    let attributes: Attributes | undefined;
    this.OPTION(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // For now, treat content as plain text (no nested inline parsing)
    const contentNode: TextNode = {
      type: "Text",
      value: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    const node: GenericInlineNode = {
      type: "GenericInline",
      name,
      content: [contentNode],
    };

    if (attributes) node.attributes = attributes;

    return node;
  });

  // Text element - consume all tokens that aren't structural delimiters
  private textElement = this.RULE("textElement", (): TextNode => {
    const textTokens: IToken[] = [];
    
    this.AT_LEAST_ONE({
      GATE: () => {
        const la = this.LA(1);
        // Stop at structural delimiters (block/inline/script starts)
        return (
          la.tokenType !== tokens.BlockCodeDelim &&
          la.tokenType !== tokens.BlockGenericDelim &&
          la.tokenType !== tokens.BlockCommentStart &&
          la.tokenType !== tokens.InlineCommentStart &&
          la.tokenType !== tokens.ScriptExprStart
        );
      },
      DEF: () => {
        const token = this.OR([
          // Escaped tokens - treat as literal text with their unescaped value
          { ALT: () => this.CONSUME(tokens.EscapedHash) },
          { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
          { ALT: () => this.CONSUME(tokens.EscapedColon) },
          { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
          { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
          { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
          { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
          { ALT: () => this.CONSUME(tokens.EscapedDash) },
          { ALT: () => this.CONSUME(tokens.EscapedDollar) },
          { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
          { ALT: () => this.CONSUME(tokens.EscapedDot) },
          { ALT: () => this.CONSUME(tokens.EscapedQuestion) },
          { ALT: () => this.CONSUME(tokens.Backslash) },
          // Regular text tokens
          { ALT: () => this.CONSUME(tokens.Content) },
          { ALT: () => this.CONSUME(tokens.Identifier) },
          { ALT: () => this.CONSUME(tokens.Whitespace) },
          { ALT: () => this.CONSUME(tokens.Newline) },
          { ALT: () => this.CONSUME(tokens.StringValue) },
          { ALT: () => this.CONSUME(tokens.Number) },
          { ALT: () => this.CONSUME(tokens.Colon) },
          { ALT: () => this.CONSUME(tokens.Backtick) },
          { ALT: () => this.CONSUME(tokens.LBrace) },
          { ALT: () => this.CONSUME(tokens.ScriptExprEnd) },
          { ALT: () => this.CONSUME(tokens.LBracket) },
          { ALT: () => this.CONSUME(tokens.RBracket) },
          { ALT: () => this.CONSUME(tokens.Hash) },
          { ALT: () => this.CONSUME(tokens.Dot) },
          { ALT: () => this.CONSUME(tokens.At) },
          { ALT: () => this.CONSUME(tokens.Question) },
          { ALT: () => this.CONSUME(tokens.Percent) },
          { ALT: () => this.CONSUME(tokens.Equals) },
          { ALT: () => this.CONSUME(tokens.Dollar) },
          { ALT: () => this.CONSUME(tokens.AnyChar) },
        ]);
        textTokens.push(token);
      },
    });

    const node: TextNode = {
      type: "Text",
      value: textTokens.map((t) => processTokenImage(t)).join(""),
    };

    return node;
  });

  // Attributes: [#id .class ?option key=value @event=handler]
  private attributes = this.RULE("attributes", (): Attributes => {
    this.CONSUME(tokens.LBracket);

    const attrs: Attributes = {
      classes: [],
      options: [],
      keyValues: {},
      events: {},
    };

    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            // #id
            this.CONSUME(tokens.Hash);
            const id = this.CONSUME(tokens.Identifier);
            attrs.id = id.image;
          },
        },
        {
          ALT: () => {
            // .class
            this.CONSUME(tokens.Dot);
            const cls = this.CONSUME2(tokens.Identifier);
            attrs.classes.push(cls.image);
          },
        },
        {
          ALT: () => {
            // ?option
            this.CONSUME(tokens.Question);
            const opt = this.CONSUME3(tokens.Identifier);
            attrs.options.push(opt.image);
          },
        },
        {
          ALT: () => {
            // @event=handler
            this.CONSUME(tokens.At);
            const eventName = this.CONSUME4(tokens.Identifier);
            this.CONSUME(tokens.Equals);
            const handler = this.OR2([
              { ALT: () => this.CONSUME(tokens.StringValue) },
              { ALT: () => this.CONSUME5(tokens.Identifier) },
            ]);
            attrs.events[eventName.image] = handler.image;
          },
        },
        {
          ALT: () => {
            // key=value
            const key = this.CONSUME6(tokens.Identifier);
            this.CONSUME2(tokens.Equals);
            const value = this.OR3([
              { ALT: () => this.CONSUME2(tokens.StringValue) },
              { ALT: () => this.CONSUME7(tokens.Identifier) },
            ]);
            attrs.keyValues[key.image] = value.image;
          },
        },
        {
          ALT: () => {
            // Skip whitespace
            this.CONSUME(tokens.Whitespace);
          },
        },
      ]);
    });

    this.CONSUME(tokens.RBracket);

    return attrs;
  });
}

export function createParser(): BlocksParser {
  return new BlocksParser();
}
