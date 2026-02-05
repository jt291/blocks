import { describe, it, expect } from "vitest";
import { createLexer } from "../src/lexer/lexer";
import * as tokens from "../src/lexer/tokens";

describe("Lexer", () => {
  it("should tokenize block comment delimiters", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("/* content */");

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.tokens[0].tokenType).toBe(tokens.BlockCommentStart);
  });

  it("should tokenize code block delimiters", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("``` code ```");

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.tokens[0].tokenType).toBe(tokens.BlockCodeDelim);
  });

  it("should tokenize script block delimiters", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("!!! script !!!");

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.tokens[0].tokenType).toBe(tokens.BlockScriptDelim);
  });

  it("should tokenize generic block delimiters", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("::: content :::");

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.tokens[0].tokenType).toBe(tokens.BlockGenericDelim);
    expect(result.tokens[0].image).toBe(":::");
  });

  it("should tokenize generic block delimiters of different lengths", () => {
    const lexer = createLexer();
    const result = lexer.tokenize(":::: content ::::");

    expect(result.tokens[0].tokenType).toBe(tokens.BlockGenericDelim);
    expect(result.tokens[0].image).toBe("::::");
  });

  it("should tokenize inline comment", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("// comment\n");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineCommentStart);
  });

  it("should tokenize inline code delimiter", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("`code`");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineCodeDelim);
  });

  it("should tokenize inline script delimiter", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("!script!");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineScriptDelim);
  });

  it("should tokenize inline generic delimiter", () => {
    const lexer = createLexer();
    const result = lexer.tokenize(":text:");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineGenericDelim);
  });

  it("should tokenize attributes", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("{ #id .class %option key=value }");

    expect(result.tokens[0].tokenType).toBe(tokens.LBrace);
    expect(result.tokens.some((t) => t.tokenType === tokens.Hash)).toBe(true);
    expect(result.tokens.some((t) => t.tokenType === tokens.Dot)).toBe(true);
    expect(result.tokens.some((t) => t.tokenType === tokens.Percent)).toBe(
      true,
    );
    expect(result.tokens.some((t) => t.tokenType === tokens.Equals)).toBe(true);
  });

  it("should tokenize identifier", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("myIdentifier");

    expect(result.tokens[0].tokenType).toBe(tokens.Identifier);
    expect(result.tokens[0].image).toBe("myIdentifier");
  });
});
