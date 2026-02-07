/**
 * Token Types for Blocks Lexer
 *
 * Based on specification: docs/SPECIFICATION.md
 */

// ============================================================================
// Token Types
// ============================================================================

/**
 * All token types in Blocks language
 */
export enum TokenType {
  // Structural
  EOF = "EOF",
  NEWLINE = "NEWLINE",
  WHITESPACE = "WHITESPACE",

  // Text
  TEXT = "TEXT",

  // Comments
  COMMENT_START = "COMMENT_START", // /*
  COMMENT_END = "COMMENT_END", // */
  COMMENT_LINE = "COMMENT_LINE", // //

  // Delimiters
  BACKTICK = "BACKTICK", // `
  COLON = "COLON", // :
  HASH = "HASH", // #
  DASH = "DASH", // -
  EXCLAMATION = "EXCLAMATION", // !

  // Brackets
  LBRACE = "LBRACE", // {
  RBRACE = "RBRACE", // }
  LBRACKET = "LBRACKET", // [
  RBRACKET = "RBRACKET", // ]

  // Special
  DOLLAR = "DOLLAR", // $
  AT = "AT", // @
  DOT = "DOT", // .
  QUESTION = "QUESTION", // ?
  EQUALS = "EQUALS", // =
  QUOTE_DOUBLE = "QUOTE_DOUBLE", // "
  QUOTE_SINGLE = "QUOTE_SINGLE", // '
  BACKSLASH = "BACKSLASH", // \

  // Escaped characters
  ESCAPED_HASH = "ESCAPED_HASH", // \#
  ESCAPED_BACKTICK = "ESCAPED_BACKTICK", // \`
  ESCAPED_COLON = "ESCAPED_COLON", // \:
  ESCAPED_LBRACE = "ESCAPED_LBRACE", // \{
  ESCAPED_RBRACE = "ESCAPED_RBRACE", // \}
  ESCAPED_LBRACKET = "ESCAPED_LBRACKET", // \[
  ESCAPED_RBRACKET = "ESCAPED_RBRACKET", // \]
  ESCAPED_DASH = "ESCAPED_DASH", // \-
  ESCAPED_DOLLAR = "ESCAPED_DOLLAR", // \$
  ESCAPED_BACKSLASH = "ESCAPED_BACKSLASH", // \\
  ESCAPED_EXCLAMATION = "ESCAPED_EXCLAMATION", // \!
  LINE_CONTINUATION = "LINE_CONTINUATION", // \<newline>

  // Identifiers and literals
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",
}

// ============================================================================
// Token Interface
// ============================================================================

/**
 * A single token
 */
export interface Token {
  /** Token type */
  type: TokenType;
  /** Token value (raw text) */
  value: string;
  /** Source location */
  loc: {
    start: {
      line: number;
      column: number;
      offset: number;
    };
    end: {
      line: number;
      column: number;
      offset: number;
    };
  };
}

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Check if token is a delimiter
 */
export function isDelimiter(token: Token): boolean {
  return [
    TokenType.BACKTICK,
    TokenType.COLON,
    TokenType.HASH,
    TokenType.DASH,
    TokenType.EXCLAMATION,
  ].includes(token.type);
}

/**
 * Check if token is an escaped character
 */
export function isEscaped(token: Token): boolean {
  return token.type.startsWith("ESCAPED_");
}

/**
 * Check if token is a bracket
 */
export function isBracket(token: Token): boolean {
  return [
    TokenType.LBRACE,
    TokenType.RBRACE,
    TokenType.LBRACKET,
    TokenType.RBRACKET,
  ].includes(token.type);
}

/**
 * Check if token is whitespace
 */
export function isWhitespace(token: Token): boolean {
  return (
    token.type === TokenType.WHITESPACE || token.type === TokenType.NEWLINE
  );
}

/**
 * Get the literal character for an escaped token
 */
export function getEscapedChar(token: Token): string {
  const escapeMap: Partial<Record<TokenType, string>> = {
    [TokenType.ESCAPED_HASH]: "#",
    [TokenType.ESCAPED_BACKTICK]: "`",
    [TokenType.ESCAPED_COLON]: ":",
    [TokenType.ESCAPED_LBRACE]: "{",
    [TokenType.ESCAPED_RBRACE]: "}",
    [TokenType.ESCAPED_LBRACKET]: "[",
    [TokenType.ESCAPED_RBRACKET]: "]",
    [TokenType.ESCAPED_DASH]: "-",
    [TokenType.ESCAPED_DOLLAR]: "$",
    [TokenType.ESCAPED_BACKSLASH]: "\\",
    [TokenType.ESCAPED_EXCLAMATION]: "!",
  };

  return escapeMap[token.type] || token.value;
}
