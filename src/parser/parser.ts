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
  ScriptBlockNode,
  ScriptInlineNode,
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

/**
 * Parse attributes from a string like "{#id .class %option key=value}"
 */
function parseAttributesString(attrsStr: string): Attributes | undefined {
  if (!attrsStr || !attrsStr.trim()) {
    return undefined;
  }

  // Remove outer braces and trim
  const content = attrsStr.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
  if (!content) {
    return undefined;
  }

  const attrs: Attributes = {
    classes: [],
    options: [],
    keyValues: {},
  };

  // Split by whitespace and parse each part
  const parts = content.match(/\S+/g) || [];
  for (const part of parts) {
    if (part.startsWith("#")) {
      // ID attribute
      attrs.id = part.substring(1);
    } else if (part.startsWith(".")) {
      // Class attribute
      attrs.classes.push(part.substring(1));
    } else if (part.startsWith("%")) {
      // Option attribute
      attrs.options.push(part.substring(1));
    } else if (part.includes("=")) {
      // Key-value attribute
      const [key, ...valueParts] = part.split("=");
      if (key) {
        const value = valueParts.join("="); // Handle = in value
        attrs.keyValues[key] = value; // Keep quotes as-is to match old behavior
      }
    }
  }

  return attrs;
}

/**
 * Parse a complete inline code token: `#name? content`{attrs?}
 * Extracts name, content, and attributes from the token image
 */
function parseInlineCodeToken(tokenImage: string): {
  name?: string;
  content: string;
  attributes?: Attributes;
} {
  // Check if there are attributes at the end: `...`{...}
  const attrsMatch = tokenImage.match(/^(`[^`\n]*`)\s*(\{[^}]+\})$/);
  let coreInline: string;
  let attributes: Attributes | undefined;

  if (attrsMatch?.[1] && attrsMatch[2]) {
    coreInline = attrsMatch[1]; // The `content` part
    attributes = parseAttributesString(attrsMatch[2]); // The {attrs} part
  } else {
    coreInline = tokenImage;
  }

  // Remove the backticks
  const innerContent = coreInline.substring(1, coreInline.length - 1);

  // Check for #name at the start
  const nameMatch = innerContent.match(/^#([a-zA-Z_][a-zA-Z0-9_-]*)\s*/);
  let name: string | undefined;
  let content: string;

  if (nameMatch) {
    name = nameMatch[1];
    content = innerContent.substring(nameMatch[0].length);
  } else {
    content = innerContent;
  }

  return { name, content, attributes };
}

/**
 * Parse a complete inline script token: !#name? content!{attrs?}
 * Extracts name, content, and attributes from the token image
 */
function parseInlineScriptToken(tokenImage: string): {
  name?: string;
  content: string;
  attributes?: Attributes;
} {
  // Check if there are attributes at the end: !...!{...}
  const attrsMatch = tokenImage.match(/^(![^!\n]*!)\s*(\{[^}]+\})$/);
  let coreInline: string;
  let attributes: Attributes | undefined;

  if (attrsMatch?.[1] && attrsMatch[2]) {
    coreInline = attrsMatch[1]; // The !content! part
    attributes = parseAttributesString(attrsMatch[2]); // The {attrs} part
  } else {
    coreInline = tokenImage;
  }

  // Remove the exclamation marks
  const innerContent = coreInline.substring(1, coreInline.length - 1);

  // Check for #name at the start
  const nameMatch = innerContent.match(/^#([a-zA-Z_][a-zA-Z0-9_-]*)\s*/);
  let name: string | undefined;
  let content: string;

  if (nameMatch) {
    name = nameMatch[1];
    content = innerContent.substring(nameMatch[0].length);
  } else {
    content = innerContent;
  }

  return { name, content, attributes };
}

/**
 * Parse a complete inline generic token: :#name? content:{attrs?}
 * Extracts name, content, and attributes from the token image
 */
function parseInlineGenericToken(tokenImage: string): {
  name?: string;
  content: string;
  attributes?: Attributes;
} {
  // Check if there are attributes at the end: :...::{...}
  const attrsMatch = tokenImage.match(/^(:[^:\n]*:)\s*(\{[^}]+\})$/);
  let coreInline: string;
  let attributes: Attributes | undefined;

  if (attrsMatch?.[1] && attrsMatch[2]) {
    coreInline = attrsMatch[1]; // The :content: part
    attributes = parseAttributesString(attrsMatch[2]); // The {attrs} part
  } else {
    coreInline = tokenImage;
  }

  // Remove the colons
  const innerContent = coreInline.substring(1, coreInline.length - 1);

  // Check for #name at the start
  const nameMatch = innerContent.match(/^#([a-zA-Z_][a-zA-Z0-9_-]*)\s*/);
  let name: string | undefined;
  let content: string;

  if (nameMatch) {
    name = nameMatch[1];
    content = innerContent.substring(nameMatch[0].length);
  } else {
    content = innerContent;
  }

  return { name, content, attributes };
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
    (): (BlockNode | InlineNode | TextNode)[] => {
      const children: (BlockNode | InlineNode | TextNode)[] = [];

      this.MANY(() => {
        const child = this.OR([
          { ALT: () => this.SUBRULE(this.blockElement) },
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.textElement) },
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
      { ALT: () => this.SUBRULE(this.scriptBlock) },
      { ALT: () => this.SUBRULE(this.genericBlock) },
    ]);
  });

  // Comment block: /* #name? content */
  // Simplified: only # prefix indicates name, no attributes ever
  private commentBlock = this.RULE("commentBlock", (): CommentBlockNode => {
    this.CONSUME(tokens.BlockCommentStart);

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    let name: string | undefined;
    const contentTokens: IToken[] = [];

    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY2(() => {
        this.CONSUME3(tokens.Whitespace);
      });
    });

    // Consume all remaining content until */
    this.MANY3(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        // Escaped tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedExclamation) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Complete inline tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.InlineCodeCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineCodeComplete) },
        { ALT: () => this.CONSUME(tokens.InlineScriptCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineScriptComplete) },
        { ALT: () => this.CONSUME(tokens.InlineGenericCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineGenericComplete) },
        // Individual delimiters (punctuation)
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    this.CONSUME(tokens.BlockCommentEnd);

    const node: CommentBlockNode = {
      type: "CommentBlock",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (name) {
      node.name = name;
    }

    return node;
  });

  // Code block: ```#name? {attrs?} content ```
  private codeBlock = this.RULE("codeBlock", (): CodeBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockCodeDelim);
    const openDelimLength = openDelim.image.length;

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    let name: string | undefined;
    let attributes: Attributes | undefined;

    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;

      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });

    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
      ]);
    });

    // Consume all content until ```
    const contentTokens: IToken[] = [];
    this.MANY4(() => {
      const tok = this.OR2([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME4(tokens.Whitespace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        // Escaped tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedExclamation) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Complete inline tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.InlineCodeCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineCodeComplete) },
        { ALT: () => this.CONSUME(tokens.InlineScriptCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineScriptComplete) },
        { ALT: () => this.CONSUME(tokens.InlineGenericCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineGenericComplete) },
        // Individual delimiters (punctuation)
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
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
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (name) node.name = name;
    if (attributes) node.attributes = attributes;

    return node;
  });

  // Script block: !!!#name? {attrs?} content !!!
  private scriptBlock = this.RULE("scriptBlock", (): ScriptBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockScriptDelim);
    const openDelimLength = openDelim.image.length;

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    let name: string | undefined;
    let attributes: Attributes | undefined;

    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;

      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });

    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
      ]);
    });

    // Consume all content until !!!
    const contentTokens: IToken[] = [];
    this.MANY4(() => {
      const tok = this.OR2([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME4(tokens.Whitespace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        // Escaped tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedExclamation) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Complete inline tokens (can appear in block content)
        { ALT: () => this.CONSUME(tokens.InlineCodeCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineCodeComplete) },
        { ALT: () => this.CONSUME(tokens.InlineScriptCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineScriptComplete) },
        { ALT: () => this.CONSUME(tokens.InlineGenericCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineGenericComplete) },
        // Individual delimiters (punctuation)
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
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

    const closeDelim = this.CONSUME2(tokens.BlockScriptDelim);
    const closeLength = closeDelim.image.length;

    // Verify exact length match
    if (openDelimLength !== closeLength) {
      const closeLine = getLineNumber(closeDelim);
      const openLine = getLineNumber(openDelim);
      throw new Error(
        `Script block closing delimiter length mismatch: expected ${openDelimLength} exclamation mark${openDelimLength > 1 ? "s" : ""} but got ${closeLength} at line ${closeLine} (opened at line ${openLine})`,
      );
    }

    const node: ScriptBlockNode = {
      type: "ScriptBlock",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (name) node.name = name;
    if (attributes) node.attributes = attributes;

    return node;
  });

  // Generic block: :::#name? {attrs?} content :::
  private genericBlock = this.RULE("genericBlock", (): GenericBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockGenericDelim);
    const delimLength = openDelim.image.length;

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    let name: string | undefined;
    let attributes: Attributes | undefined;

    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;

      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });

    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });

    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
      ]);
    });

    // Parse content (can contain blocks and inlines)
    const content: (BlockNode | InlineNode | TextNode)[] = [];
    this.MANY4({
      GATE: () => {
        // Continue parsing until we find a closing delimiter of EXACTLY the same length
        // This allows nested generic blocks with different lengths
        if (this.LA(1).tokenType === tokens.BlockGenericDelim) {
          const nextDelim = this.LA(1) as IToken;
          // Only stop if the delimiter has EXACTLY the same length
          return nextDelim.image.length !== delimLength;
        }
        return true; // Continue if it's not a delimiter at all
      },
      DEF: () => {
        const child = this.OR2([
          { ALT: () => this.SUBRULE(this.blockElement) },
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.textElement) },
        ]);
        if (child) content.push(child);
      },
    });

    const closeDelim = this.CONSUME2(tokens.BlockGenericDelim);

    // Verify exact length match (shouldn't fail with correct GATE, but safety check)
    if (closeDelim.image.length !== delimLength) {
      throw new Error(
        `Generic block closing delimiter length mismatch: expected ${delimLength} colons but got ${closeDelim.image.length}`,
      );
    }

    const node: GenericBlockNode = {
      type: "GenericBlock",
      content,
    };

    if (name) node.name = name;
    if (attributes) node.attributes = attributes;

    return node;
  });

  // Inline elements
  private inlineElement = this.RULE("inlineElement", (): InlineNode => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.commentInline) },
      { ALT: () => this.SUBRULE(this.codeInline) },
      { ALT: () => this.SUBRULE(this.scriptInline) },
      { ALT: () => this.SUBRULE(this.genericInline) },
    ]);
  });

  // Comment inline: // #name? content\n
  private commentInline = this.RULE("commentInline", (): CommentInlineNode => {
    this.CONSUME(tokens.InlineCommentStart);

    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });

    let name: string | undefined;
    const contentTokens: IToken[] = [];

    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY3(() => {
        this.CONSUME3(tokens.Whitespace);
      });
    });

    // Consume all remaining content until newline or EOF
    this.MANY2(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        // Escaped tokens (can appear in inline comment)
        { ALT: () => this.CONSUME(tokens.EscapedHash) },
        { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
        { ALT: () => this.CONSUME(tokens.EscapedExclamation) },
        { ALT: () => this.CONSUME(tokens.EscapedColon) },
        { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
        { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
        { ALT: () => this.CONSUME(tokens.EscapedDash) },
        { ALT: () => this.CONSUME(tokens.EscapedDollar) },
        { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
        { ALT: () => this.CONSUME(tokens.Backslash) },
        // Complete inline tokens (can appear in inline comment)
        { ALT: () => this.CONSUME(tokens.InlineCodeCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineCodeComplete) },
        { ALT: () => this.CONSUME(tokens.InlineScriptCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineScriptComplete) },
        { ALT: () => this.CONSUME(tokens.InlineGenericCompleteWithAttrs) },
        { ALT: () => this.CONSUME(tokens.InlineGenericComplete) },
        // Individual delimiters (punctuation)
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) },
      ]);
      if (tok) contentTokens.push(tok);
    });

    this.OPTION2(() => this.CONSUME(tokens.Newline));

    const node: CommentInlineNode = {
      type: "CommentInline",
      content: contentTokens.map((t) => processTokenImage(t)).join(""),
    };

    if (name) {
      node.name = name;
    }

    return node;
  });

  // Code inline: `content` or `content`{attrs} (complete token from lexer)
  private codeInline = this.RULE("codeInline", (): CodeInlineNode => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.InlineCodeCompleteWithAttrs) },
      { ALT: () => this.CONSUME(tokens.InlineCodeComplete) },
    ]);

    // Parse the token image (only happens during actual parsing, not grammar recording)
    const tokenImage = token?.image || "";
    const parsed = parseInlineCodeToken(tokenImage);

    const node: CodeInlineNode = {
      type: "CodeInline",
      content: parsed.content,
    };

    if (parsed.name) node.name = parsed.name;
    if (parsed.attributes) node.attributes = parsed.attributes;

    return node;
  });

  // Script inline: !content! or !content!{attrs} (complete token from lexer)
  private scriptInline = this.RULE("scriptInline", (): ScriptInlineNode => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.InlineScriptCompleteWithAttrs) },
      { ALT: () => this.CONSUME(tokens.InlineScriptComplete) },
    ]);

    // Parse the token image (only happens during actual parsing, not grammar recording)
    const tokenImage = token?.image || "";
    const parsed = parseInlineScriptToken(tokenImage);

    const node: ScriptInlineNode = {
      type: "ScriptInline",
      content: parsed.content,
    };

    if (parsed.name) node.name = parsed.name;
    if (parsed.attributes) node.attributes = parsed.attributes;

    return node;
  });

  // Generic inline: :content: or :content:{attrs} (complete token from lexer)
  // NOTE: For simplicity, content is treated as plain text, not parsed recursively for nested inlines
  private genericInline = this.RULE("genericInline", (): GenericInlineNode => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.InlineGenericCompleteWithAttrs) },
      { ALT: () => this.CONSUME(tokens.InlineGenericComplete) },
    ]);

    // Parse the token image (only happens during actual parsing, not grammar recording)
    const tokenImage = token?.image || "";
    const parsed = parseInlineGenericToken(tokenImage);

    // For now, treat content as plain text (no nested inline parsing)
    const contentNode: TextNode = {
      type: "Text",
      value: parsed.content,
    };

    const node: GenericInlineNode = {
      type: "GenericInline",
      content: [contentNode],
    };

    if (parsed.name) node.name = parsed.name;
    if (parsed.attributes) node.attributes = parsed.attributes;

    return node;
  });

  // Text element
  private textElement = this.RULE("textElement", (): TextNode => {
    const token = this.OR([
      // Escaped tokens - treat as literal text with their unescaped value
      { ALT: () => this.CONSUME(tokens.EscapedHash) },
      { ALT: () => this.CONSUME(tokens.EscapedBacktick) },
      { ALT: () => this.CONSUME(tokens.EscapedExclamation) },
      { ALT: () => this.CONSUME(tokens.EscapedColon) },
      { ALT: () => this.CONSUME(tokens.EscapedLBrace) },
      { ALT: () => this.CONSUME(tokens.EscapedRBrace) },
      { ALT: () => this.CONSUME(tokens.EscapedLBracket) },
      { ALT: () => this.CONSUME(tokens.EscapedRBracket) },
      { ALT: () => this.CONSUME(tokens.EscapedDash) },
      { ALT: () => this.CONSUME(tokens.EscapedDollar) },
      { ALT: () => this.CONSUME(tokens.EscapedBackslash) },
      { ALT: () => this.CONSUME(tokens.Backslash) },
      // Regular text tokens
      { ALT: () => this.CONSUME(tokens.Content) },
      { ALT: () => this.CONSUME(tokens.Whitespace) },
      { ALT: () => this.CONSUME(tokens.Newline) },
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.CONSUME(tokens.StringValue) },
      { ALT: () => this.CONSUME(tokens.LBrace) },
      { ALT: () => this.CONSUME(tokens.RBrace) },
      { ALT: () => this.CONSUME(tokens.Hash) },
      { ALT: () => this.CONSUME(tokens.Dot) },
      { ALT: () => this.CONSUME(tokens.Percent) },
      { ALT: () => this.CONSUME(tokens.Equals) },
      { ALT: () => this.CONSUME(tokens.AnyChar) },
      { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
      { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
      { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
    ]);

    const node: TextNode = {
      type: "Text",
      value: processTokenImage(token),
    };

    return node;
  });

  // Attributes: { #id .class %option key=value }
  private attributes = this.RULE("attributes", (): Attributes => {
    this.CONSUME(tokens.LBrace);

    const attrs: Attributes = {
      classes: [],
      options: [],
      keyValues: {},
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
            // %option
            this.CONSUME(tokens.Percent);
            const opt = this.CONSUME3(tokens.Identifier);
            attrs.options.push(opt.image);
          },
        },
        {
          ALT: () => {
            // key=value
            const key = this.CONSUME4(tokens.Identifier);
            this.CONSUME(tokens.Equals);
            const value = this.OR2([
              { ALT: () => this.CONSUME(tokens.StringValue) },
              { ALT: () => this.CONSUME5(tokens.Identifier) },
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

    this.CONSUME(tokens.RBrace);

    return attrs;
  });
}

export function createParser(): BlocksParser {
  return new BlocksParser();
}
