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

  it("should tokenize inline code complete", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("`code`");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineCodeComplete);
  });

  it("should tokenize inline script complete", () => {
    const lexer = createLexer();
    const result = lexer.tokenize("!script!");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineScriptComplete);
  });

  it("should tokenize inline generic complete", () => {
    const lexer = createLexer();
    const result = lexer.tokenize(":text:");

    expect(result.tokens[0].tokenType).toBe(tokens.InlineGenericComplete);
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

  describe("Escape sequences", () => {
    it("should tokenize escaped hash", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\#");

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.tokens[0].tokenType).toBe(tokens.EscapedHash);
      expect(result.tokens[0].image).toBe("\\#");
    });

    it("should tokenize escaped backtick", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\`");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedBacktick);
      expect(result.tokens[0].image).toBe("\\`");
    });

    it("should tokenize escaped exclamation", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\!");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedExclamation);
      expect(result.tokens[0].image).toBe("\\!");
    });

    it("should tokenize escaped colon", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\:");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedColon);
      expect(result.tokens[0].image).toBe("\\:");
    });

    it("should tokenize escaped braces", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\{\\}");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedLBrace);
      expect(result.tokens[0].image).toBe("\\{");
      expect(result.tokens[1].tokenType).toBe(tokens.EscapedRBrace);
      expect(result.tokens[1].image).toBe("\\}");
    });

    it("should tokenize escaped brackets", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\[\\]");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedLBracket);
      expect(result.tokens[0].image).toBe("\\[");
      expect(result.tokens[1].tokenType).toBe(tokens.EscapedRBracket);
      expect(result.tokens[1].image).toBe("\\]");
    });

    it("should tokenize escaped dash", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\-");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedDash);
      expect(result.tokens[0].image).toBe("\\-");
    });

    it("should tokenize escaped dollar", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\$");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedDollar);
      expect(result.tokens[0].image).toBe("\\$");
    });

    it("should tokenize escaped backslash", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\\\");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedBackslash);
      expect(result.tokens[0].image).toBe("\\\\");
    });

    it("should tokenize multiple escaped characters", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\#\\`\\!");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedHash);
      expect(result.tokens[1].tokenType).toBe(tokens.EscapedBacktick);
      expect(result.tokens[2].tokenType).toBe(tokens.EscapedExclamation);
    });

    it("should tokenize escaped characters before regular ones", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\##test");

      expect(result.tokens[0].tokenType).toBe(tokens.EscapedHash);
      expect(result.tokens[1].tokenType).toBe(tokens.Hash);
    });

    it("should tokenize trailing backslash as Backslash token", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("test\\");

      const backslashToken = result.tokens.find(
        (t) => t.tokenType === tokens.Backslash,
      );
      expect(backslashToken).toBeDefined();
    });

    it("should tokenize unknown escape sequence as Backslash + character", () => {
      const lexer = createLexer();
      const result = lexer.tokenize("\\x");

      expect(result.tokens[0].tokenType).toBe(tokens.Backslash);
      expect(result.tokens[0].image).toBe("\\");
      // The 'x' will be tokenized as Content or Identifier
    });
  });
});

