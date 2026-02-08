import { EOF as ChevrotainEOF, createToken } from "chevrotain";

// Export EOF token from Chevrotain
export const EOF = ChevrotainEOF;

// Whitespace and structural tokens
export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /[ \t]+/,
});

export const Newline = createToken({
  name: "Newline",
  pattern: /\n|\r\n/,
});

// Block delimiters
export const BlockCommentStart = createToken({
  name: "BlockCommentStart",
  pattern: /\/\*/,
});

export const BlockCommentEnd = createToken({
  name: "BlockCommentEnd",
  pattern: /\*\//,
});

export const BlockCodeDelim = createToken({
  name: "BlockCodeDelim",
  pattern: /`{3,}/, // 3 or more backticks
});

export const BlockGenericDelim = createToken({
  name: "BlockGenericDelim",
  pattern: /:{3,}/, // 3 or more colons
});

// Script expression delimiters for ${ ... }
export const ScriptExprStart = createToken({
  name: "ScriptExprStart",
  pattern: /\$\{/,
});

export const ScriptExprEnd = createToken({
  name: "ScriptExprEnd",
  pattern: /\}/,
});

// Inline comment (special case - goes to end of line)
export const InlineCommentStart = createToken({
  name: "InlineCommentStart",
  pattern: /\/\//,
});

// Individual delimiter tokens (for fallback/punctuation)
export const InlineCodeDelim = createToken({
  name: "InlineCodeDelim",
  pattern: /`/,
});

export const InlineGenericDelim = createToken({
  name: "InlineGenericDelim",
  pattern: /:/,
});

// Attribute tokens
export const LBracket = createToken({
  name: "LBracket",
  pattern: /\[/,
});

export const RBracket = createToken({
  name: "RBracket",
  pattern: /\]/,
});

export const LBrace = createToken({
  name: "LBrace",
  pattern: /{/,
});

export const RBrace = createToken({
  name: "RBrace",
  pattern: /}/,
});

export const Hash = createToken({
  name: "Hash",
  pattern: /#/,
});

export const Dot = createToken({
  name: "Dot",
  pattern: /\./,
});

export const At = createToken({
  name: "At",
  pattern: /@/,
});

export const Question = createToken({
  name: "Question",
  pattern: /\?/,
});

export const Percent = createToken({
  name: "Percent",
  pattern: /%/,
});

export const Equals = createToken({
  name: "Equals",
  pattern: /=/,
});

// Escape tokens - backslash followed by special characters
// These must be defined BEFORE their non-escaped counterparts to have priority
export const EscapedHash = createToken({
  name: "EscapedHash",
  pattern: /\\#/,
});

export const EscapedBacktick = createToken({
  name: "EscapedBacktick",
  pattern: /\\`/,
});

export const EscapedExclamation = createToken({
  name: "EscapedExclamation",
  pattern: /\\!/,
});

export const EscapedColon = createToken({
  name: "EscapedColon",
  pattern: /\\:/,
});

export const EscapedLBrace = createToken({
  name: "EscapedLBrace",
  pattern: /\\{/,
});

export const EscapedRBrace = createToken({
  name: "EscapedRBrace",
  pattern: /\\}/,
});

export const EscapedLBracket = createToken({
  name: "EscapedLBracket",
  pattern: /\\\[/,
});

export const EscapedRBracket = createToken({
  name: "EscapedRBracket",
  pattern: /\\\]/,
});

export const EscapedDash = createToken({
  name: "EscapedDash",
  pattern: /\\-/,
});

export const EscapedDollar = createToken({
  name: "EscapedDollar",
  pattern: /\\\$/,
});

export const EscapedBackslash = createToken({
  name: "EscapedBackslash",
  pattern: /\\\\/,
});

export const EscapedDot = createToken({
  name: "EscapedDot",
  pattern: /\\\./,
});

export const EscapedQuestion = createToken({
  name: "EscapedQuestion",
  pattern: /\\\?/,
});

export const EscapedPipe = createToken({
  name: "EscapedPipe",
  pattern: /\\\|/,
});

export const LineContinuation = createToken({
  name: "LineContinuation",
  pattern: /\\(?:\r\n|\n)/,
});

export const Backslash = createToken({
  name: "Backslash",
  pattern: /\\/,
});

// Identifier for names, keys, values
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

export const StringValue = createToken({
  name: "StringValue",
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s{}[\]#.%=`!:@?]+/,
});

// Content token - matches any character sequence
export const Content = createToken({
  name: "Content",
  pattern: /[^/*:`${}\[\]@?\n]+/,
});

export const AnyChar = createToken({
  name: "AnyChar",
  pattern: /./,
});

// All tokens array for the lexer
// IMPORTANT: Order matters! Specific patterns must be tested BEFORE generic ones.
// - Escape sequences FIRST (highest priority)
// - Block delimiters (3+ chars) BEFORE inline delimiters
// - Script expressions ${...} must be BEFORE { and }
export const allTokens = [
  // Whitespace and newlines first
  Whitespace,
  Newline,

  // === ESCAPE SEQUENCES (HIGHEST PRIORITY) ===
  EscapedBackslash, // \\ must be BEFORE single backslash
  LineContinuation, // \<newline> for line continuation
  EscapedHash, // \#
  EscapedBacktick, // \`
  EscapedExclamation, // \!
  EscapedColon, // \:
  EscapedLBrace, // \{
  EscapedRBrace, // \}
  EscapedLBracket, // \[
  EscapedRBracket, // \]
  EscapedDash, // \-
  EscapedDollar, // \$
  EscapedDot, // \.
  EscapedQuestion, // \?
  EscapedPipe, // \|
  Backslash, // \ (for unknown escapes or trailing backslash)

  // === BLOCK DELIMITERS (3+ characters) BEFORE INLINE DELIMITERS ===
  BlockCommentStart, // /*
  BlockCommentEnd, // */
  BlockCodeDelim, // `{3,} must be tested BEFORE `
  BlockGenericDelim, // :{3,} must be tested BEFORE :

  // === SCRIPT EXPRESSIONS (BEFORE BRACES) ===
  ScriptExprStart, // ${ must be tested BEFORE {
  ScriptExprEnd, // } used for both script end and attributes

  // === INLINE COMMENT (special case) ===
  InlineCommentStart, // //

  // === INDIVIDUAL DELIMITERS (for punctuation fallback) ===
  InlineCodeDelim, // ` (single backtick as punctuation)
  InlineGenericDelim, // : (single colon as punctuation)

  // Attribute tokens
  LBracket,
  RBracket,
  LBrace,
  RBrace,
  Hash,
  Dot,
  At,
  Question,
  Percent,
  Equals,

  // Identifiers and values
  Identifier,
  StringValue,

  // Catch-all tokens (last)
  Content,
  AnyChar,
];
