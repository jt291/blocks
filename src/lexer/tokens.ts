import { createToken, Lexer } from "chevrotain";

// ==============================================
// WHITESPACE
// ==============================================
export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED,
});

export const Newline = createToken({
  name: "Newline",
  pattern: /\r?\n/,
});

// ==============================================
// ESCAPE SEQUENCES (HIGHEST PRIORITY)
// ==============================================
export const EscapedBackslash = createToken({
  name: "EscapedBackslash",
  pattern: /\\\\/,
});

export const EscapedHash = createToken({
  name: "EscapedHash",
  pattern: /\\#/,
});

export const EscapedDot = createToken({
  name: "EscapedDot",
  pattern: /\\\./,
});

export const EscapedQuestion = createToken({
  name: "EscapedQuestion",
  pattern: /\\\?/,
});

export const EscapedAt = createToken({
  name: "EscapedAt",
  pattern: /\\@/,
});

export const EscapedDollar = createToken({
  name: "EscapedDollar",
  pattern: /\\\$/,
});

export const EscapedBacktick = createToken({
  name: "EscapedBacktick",
  pattern: /\\`/,
});

export const EscapedColon = createToken({
  name: "EscapedColon",
  pattern: /\\:/,
});

export const EscapedPipe = createToken({
  name: "EscapedPipe",
  pattern: /\\\|/,
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

export const Backslash = createToken({
  name: "Backslash",
  pattern: /\\/,
});

// ==============================================
// BLOCK DELIMITERS (MULTI-CHAR BEFORE SINGLE)
// ==============================================

// Comment block: /* ... */
export const BlockCommentStart = createToken({
  name: "BlockCommentStart",
  pattern: /\/\*/,
});

export const BlockCommentEnd = createToken({
  name: "BlockCommentEnd",
  pattern: /\*\//,
});

// Comment inline: //
export const InlineCommentStart = createToken({
  name: "InlineCommentStart",
  pattern: /\/\//,
});

// Code block: ``` ... ```
export const BlockCodeDelim = createToken({
  name: "BlockCodeDelim",
  pattern: /```/,
});

// Generic block: ::: ... :::
export const BlockGenericDelim = createToken({
  name: "BlockGenericDelim",
  pattern: /:{3,}/,  // 3 or more colons
});

// ==============================================
// INLINE DELIMITERS
// ==============================================

// Backtick for code inline: name`content`
export const Backtick = createToken({
  name: "Backtick",
  pattern: /`/,
});

// Alias for backward compatibility
export const InlineCodeDelim = Backtick;

// Colon for generic inline: name:content
export const Colon = createToken({
  name: "Colon",
  pattern: /:/,
});

// Alias for backward compatibility
export const InlineGenericDelim = Colon;

// ==============================================
// SCRIPT EXPRESSIONS: ${ ... }
// ==============================================

// Dollar sign + brace
export const ScriptExprStart = createToken({
  name: "ScriptExprStart",
  pattern: /\$\{/,
});

export const Dollar = createToken({
  name: "Dollar",
  pattern: /\$/,
});

export const LBrace = createToken({
  name: "LBrace",
  pattern: /{/,
});

export const RBrace = createToken({
  name: "RBrace",
  pattern: /}/,
});

// Alias for backward compatibility
export const ScriptExprEnd = RBrace;

// ==============================================
// ATTRIBUTES: [ ... ]
// ==============================================

export const LBracket = createToken({
  name: "LBracket",
  pattern: /\[/,
});

export const RBracket = createToken({
  name: "RBracket",
  pattern: /\]/,
});

// Attribute markers
export const Hash = createToken({
  name: "Hash",
  pattern: /#/,
});

export const Dot = createToken({
  name: "Dot",
  pattern: /\./,
});

export const Question = createToken({
  name: "Question",
  pattern: /\?/,
});

export const At = createToken({
  name: "At",
  pattern: /@/,
});

export const Percent = createToken({
  name: "Percent",
  pattern: /%/,
});

export const Equals = createToken({
  name: "Equals",
  pattern: /=/,
});

// ==============================================
// METADATA: --- ... ---
// ==============================================

export const MetadataDelim = createToken({
  name: "MetadataDelim",
  pattern: /---/,
});

// ==============================================
// IDENTIFIERS AND VALUES
// ==============================================

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

export const StringValue = createToken({
  name: "StringValue",
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});

export const Number = createToken({
  name: "Number",
  pattern: /[0-9]+(\.[0-9]+)?/,
});

// ==============================================
// CONTENT (CATCH-ALL)
// ==============================================

export const Content = createToken({
  name: "Content",
  pattern: /[^\s\[\]\{\}\(\)#\.\?@=`:\$\|\\\/]+/,
});

export const AnyChar = createToken({
  name: "AnyChar",
  pattern: /./,
});

// ==============================================
// TOKEN LIST (ORDER MATTERS!)
// ==============================================

export const allTokens = [
  // Whitespace
  Whitespace,
  Newline,

  // Escape sequences (HIGHEST PRIORITY)
  EscapedBackslash,
  EscapedHash,
  EscapedDot,
  EscapedQuestion,
  EscapedAt,
  EscapedDollar,
  EscapedBacktick,
  EscapedColon,
  EscapedPipe,
  EscapedLBrace,
  EscapedRBrace,
  EscapedLBracket,
  EscapedRBracket,
  EscapedDash,

  // Multi-char tokens (BEFORE single chars)
  BlockCommentStart,
  BlockCommentEnd,
  InlineCommentStart,
  BlockCodeDelim,
  BlockGenericDelim,
  ScriptExprStart,
  MetadataDelim,

  // Single char delimiters
  Backtick,
  Colon,
  Dollar,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Hash,
  Dot,
  Question,
  At,
  Percent,
  Equals,
  Backslash,

  // Values
  StringValue,
  Number,
  Identifier,

  // Catch-all
  Content,
  AnyChar,
];

// ==============================================
// LEXER
// ==============================================

export const BlocksLexer = new Lexer(allTokens);

export function createLexer() {
  return BlocksLexer;
}
