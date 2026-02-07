/**
 * Tests for Token types
 */

import { describe, expect, it } from "vitest";
import type { Token } from "../../src/types/tokens";
import {
  getEscapedChar,
  isDelimiter,
  isEscaped,
  TokenType,
} from "../../src/types/tokens";

describe("Token Types", () => {
  describe("Token structure", () => {
    it("should create valid token", () => {
      const token: Token = {
        type: TokenType.TEXT,
        value: "hello",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 5, offset: 4 },
        },
      };

      expect(token.type).toBe(TokenType.TEXT);
      expect(token.value).toBe("hello");
    });
  });

  describe("isDelimiter", () => {
    it("should identify delimiters", () => {
      const backtick: Token = {
        type: TokenType.BACKTICK,
        value: "`",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      };

      expect(isDelimiter(backtick)).toBe(true);
    });

    it("should reject non-delimiters", () => {
      const text: Token = {
        type: TokenType.TEXT,
        value: "hello",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 5, offset: 4 },
        },
      };

      expect(isDelimiter(text)).toBe(false);
    });
  });

  describe("isEscaped", () => {
    it("should identify escaped tokens", () => {
      const escaped: Token = {
        type: TokenType.ESCAPED_HASH,
        value: "#",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      };

      expect(isEscaped(escaped)).toBe(true);
    });
  });

  describe("getEscapedChar", () => {
    it("should return correct character for escaped token", () => {
      const token: Token = {
        type: TokenType.ESCAPED_HASH,
        value: "#",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      };

      expect(getEscapedChar(token)).toBe("#");
    });
  });
});
