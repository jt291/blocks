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

export const BlockScriptDelim = createToken({
  name: "BlockScriptDelim",
  pattern: /!{3,}/, // 3 or more exclamation marks
});

export const BlockGenericDelim = createToken({
  name: "BlockGenericDelim",
  pattern: /:{3,}/, // 3 or more colons
});

// Inline delimiters
export const InlineCommentStart = createToken({
  name: "InlineCommentStart",
  pattern: /\/\//,
});

export const InlineCodeDelim = createToken({
  name: "InlineCodeDelim",
  pattern: /`/,
});

export const InlineScriptDelim = createToken({
  name: "InlineScriptDelim",
  pattern: /!/,
});

export const InlineGenericDelim = createToken({
  name: "InlineGenericDelim",
  pattern: /:/,
});

// Attribute tokens
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

export const Percent = createToken({
  name: "Percent",
  pattern: /%/,
});

export const Equals = createToken({
  name: "Equals",
  pattern: /=/,
});

// Identifier for names, keys, values
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

export const StringValue = createToken({
  name: "StringValue",
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s{}#.%=`!:]+/,
});

// Content token - matches any character sequence
export const Content = createToken({
  name: "Content",
  pattern: /[^/*:`!{}\n]+/,
});

export const AnyChar = createToken({
  name: "AnyChar",
  pattern: /./,
});

// All tokens array for the lexer
// IMPORTANT: Order matters! Specific patterns must be tested BEFORE generic ones.
// - Block delimiters (3+ chars) BEFORE inline delimiters (1 char)
// - This prevents single `:` from matching before `:::`
export const allTokens = [
  // Whitespace and newlines first
  Whitespace,
  Newline,

  // === BLOCK DELIMITERS (3+ characters) BEFORE INLINE DELIMITERS ===
  BlockCommentStart, // /*
  BlockCommentEnd, // */
  BlockCodeDelim, // `{3,} must be tested BEFORE `
  BlockScriptDelim, // !{3,} must be tested BEFORE !
  BlockGenericDelim, // :{3,} must be tested BEFORE :

  // === INLINE DELIMITERS (1 character) AFTER BLOCK DELIMITERS ===
  InlineCommentStart, // //
  InlineCodeDelim, // ` (single backtick)
  InlineScriptDelim, // ! (single exclamation)
  InlineGenericDelim, // : (single colon)

  // Attribute tokens
  LBrace,
  RBrace,
  Hash,
  Dot,
  Percent,
  Equals,

  // Identifiers and values
  Identifier,
  StringValue,

  // Catch-all tokens (last)
  Content,
  AnyChar,
];
