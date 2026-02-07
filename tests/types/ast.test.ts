/**
 * Tests for AST types
 */

import { describe, expect, it } from "vitest";
import type {
  Attributes,
  CodeInline,
  CommentBlockNode,
  GenericBlock,
  Location,
  Position,
  ScriptNode,
  TextNode,
} from "../../src/types/ast";
import {
  isBlockNode,
  isCommentNode,
  isGenericBlock,
  isInlineNode,
  isScriptNode,
  isTextNode,
} from "../../src/types/ast";

describe("AST Types", () => {
  describe("Position", () => {
    it("should have correct structure", () => {
      const pos: Position = {
        path: "test.blocks",
        line: 1,
        column: 1,
        offset: 0,
      };

      expect(pos.path).toBe("test.blocks");
      expect(pos.line).toBe(1);
      expect(pos.column).toBe(1);
      expect(pos.offset).toBe(0);
    });
  });

  describe("Location", () => {
    it("should have start and end positions", () => {
      const loc: Location = {
        start: { path: "test.blocks", line: 1, column: 1, offset: 0 },
        end: { path: "test.blocks", line: 1, column: 10, offset: 9 },
      };

      expect(loc.start.line).toBe(1);
      expect(loc.end.line).toBe(1);
    });
  });

  describe("TextNode", () => {
    it("should create valid TextNode", () => {
      const node: TextNode = {
        type: "Text",
        value: "Hello world",
        loc: {
          start: { path: "test.blocks", line: 1, column: 1, offset: 0 },
          end: { path: "test.blocks", line: 1, column: 11, offset: 10 },
        },
      };

      expect(node.type).toBe("Text");
      expect(node.value).toBe("Hello world");
      expect(isTextNode(node)).toBe(true);
    });
  });

  describe("CommentBlockNode", () => {
    it("should create valid CommentBlockNode", () => {
      const node: CommentBlockNode = {
        type: "CommentBlock",
        content: "This is a comment",
      };

      expect(node.type).toBe("CommentBlock");
      expect(isCommentNode(node)).toBe(true);
    });
  });

  describe("ScriptNode", () => {
    it("should create valid ScriptNode", () => {
      const node: ScriptNode = {
        type: "Script",
        content: "price * 1.2",
      };

      expect(node.type).toBe("Script");
      expect(isScriptNode(node)).toBe(true);
    });
  });

  describe("CodeInline", () => {
    it("should create valid CodeInline", () => {
      const node: CodeInline = {
        type: "CodeInline",
        name: "code",
        content: [{ type: "Text", value: "print('hello')" }],
        attributes: {
          classes: ["highlight"],
          options: [],
          keyValues: {},
          events: {},
        },
      };

      expect(node.type).toBe("CodeInline");
      expect(node.name).toBe("code");
      expect(isInlineNode(node)).toBe(true);
    });
  });

  describe("GenericBlock", () => {
    it("should create valid GenericBlock", () => {
      const node: GenericBlock = {
        type: "GenericBlock",
        name: "section",
        delimiter: ":::",
        content: [],
        attributes: {
          id: "main",
          classes: ["container"],
          options: [],
          keyValues: {},
          events: {},
        },
      };

      expect(node.type).toBe("GenericBlock");
      expect(node.name).toBe("section");
      expect(node.delimiter).toBe(":::");
      expect(isBlockNode(node)).toBe(true);
      expect(isGenericBlock(node)).toBe(true);
    });
  });

  describe("Attributes", () => {
    it("should handle all attribute types", () => {
      const attrs: Attributes = {
        id: "example",
        classes: ["highlight", "important"],
        options: ["dismissible", "collapsible"],
        keyValues: { lang: "fr", theme: "dark" },
        events: { click: "handleClick", mouseenter: "showTooltip" },
      };

      expect(attrs.id).toBe("example");
      expect(attrs.classes).toHaveLength(2);
      expect(attrs.options).toHaveLength(2);
      expect(attrs.keyValues.lang).toBe("fr");
      expect(attrs.events.click).toBe("handleClick");
    });
  });
});
