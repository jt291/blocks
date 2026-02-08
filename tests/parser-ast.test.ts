import { describe, expect, it } from "vitest";
import { parse } from "../src/index";
import type {
  CodeBlockNode,
  GenericBlockNode,
  GenericInlineNode,
  ScriptNode,
  TextNode,
} from "../src/parser/ast";

// Type guard helpers
function isTextNode(node: unknown): node is TextNode {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "Text"
  );
}

function isCodeBlock(node: unknown): node is CodeBlockNode {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "CodeBlock"
  );
}

function isGenericBlock(node: unknown): node is GenericBlockNode {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "GenericBlock"
  );
}

function isGenericInline(node: unknown): node is GenericInlineNode {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "GenericInline"
  );
}

function isScript(node: unknown): node is ScriptNode {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "Script"
  );
}

describe("Parser AST", () => {
  describe("Basic parsing", () => {
    it("should parse empty document", () => {
      const result = parse("");

      expect(result.errors).toHaveLength(0);
      expect(result.ast.type).toBe("Document");
      expect(result.ast.children).toHaveLength(0);
    });

    it("should parse simple text", () => {
      const result = parse("hello world");

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children).toHaveLength(1);
      const firstChild = result.ast.children[0];
      expect(firstChild.type).toBe("Text");
      if (isTextNode(firstChild)) {
        expect(firstChild.value).toContain("hello");
      }
    });
  });

  describe("Comments", () => {
    it("should parse block comment", () => {
      const result = parse("/* comment */");

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        content: expect.stringContaining("comment"),
      });
    });

    it("should parse inline comment", () => {
      const result = parse("// comment\n");

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("CommentInline");
    });
  });

  describe("Code blocks", () => {
    it("should parse code block with language", () => {
      const result = parse("```python\nprint('hello')\n```");

      expect(result.errors).toHaveLength(0);
      const codeBlock = result.ast.children.find((n) => n.type === "CodeBlock");
      expect(codeBlock).toBeDefined();
      if (isCodeBlock(codeBlock)) {
        expect(codeBlock.name).toBe("python");
        expect(codeBlock.content).toContain("print");
      }
    });

    it("should parse code block with attributes", () => {
      const result = parse("```python [#code1 .highlight]\ncode\n```");

      expect(result.errors).toHaveLength(0);
      const codeBlock = result.ast.children.find((n) => n.type === "CodeBlock");
      if (isCodeBlock(codeBlock)) {
        expect(codeBlock.attributes?.id).toBe("code1");
        expect(codeBlock.attributes?.classes).toContain("highlight");
      }
    });
  });

  describe("Generic blocks", () => {
    it("should parse generic block without name", () => {
      const result = parse(":::\ncontent\n:::");

      expect(result.errors).toHaveLength(0);
      const block = result.ast.children.find((n) => n.type === "GenericBlock");
      expect(block).toBeDefined();
    });

    it("should parse generic block with name", () => {
      const result = parse(":::section\ntext\n:::");

      expect(result.errors).toHaveLength(0);
      const block = result.ast.children.find((n) => n.type === "GenericBlock");
      if (isGenericBlock(block)) {
        expect(block.name).toBe("section");
      }
    });

    it("should parse generic block with attributes", () => {
      const result = parse(":::div [#main .container]\ntext\n:::");

      expect(result.errors).toHaveLength(0);
      const block = result.ast.children.find((n) => n.type === "GenericBlock");
      if (isGenericBlock(block)) {
        expect(block.attributes?.id).toBe("main");
        expect(block.attributes?.classes).toContain("container");
      }
    });

    it("should parse nested generic blocks", () => {
      const result = parse(":::outer\n::::inner\ntext\n::::\n:::");

      expect(result.errors).toHaveLength(0);
      const outer = result.ast.children.find(
        (n) =>
          n.type === "GenericBlock" && isGenericBlock(n) && n.name === "outer",
      );
      expect(outer).toBeDefined();

      if (isGenericBlock(outer)) {
        const inner = outer.content.find(
          (n) =>
            n.type === "GenericBlock" &&
            isGenericBlock(n) &&
            n.name === "inner",
        );
        expect(inner).toBeDefined();
      }
    });
  });

  describe("Script expressions", () => {
    it("should parse script expression", () => {
      const result = parse("Total ${price * quantity}");

      expect(result.errors).toHaveLength(0);
      const script = result.ast.children.find((n) => n.type === "Script");
      expect(script).toBeDefined();
      if (isScript(script)) {
        // Note: Parser strips whitespace from script content
        expect(script.content).toBe("price*quantity");
      }
    });

    it("should parse script with property access", () => {
      const result = parse("Name ${user.name}");

      expect(result.errors).toHaveLength(0);
      const script = result.ast.children.find((n) => n.type === "Script");
      if (isScript(script)) {
        expect(script.content).toBe("user.name");
      }
    });
  });

  describe("Inline elements", () => {
    it("should parse code inline", () => {
      const result = parse("code`content`");

      expect(result.errors).toHaveLength(0);
      const inline = result.ast.children.find((n) => n.type === "CodeInline");
      expect(inline).toMatchObject({
        type: "CodeInline",
        name: "code",
        content: "content",
      });
    });

    it("should parse generic inline", () => {
      const result = parse("link:https://example.com");

      expect(result.errors).toHaveLength(0);
      const inline = result.ast.children.find(
        (n) => n.type === "GenericInline",
      );
      if (isGenericInline(inline)) {
        expect(inline.name).toBe("link");
      }
    });

    it("should parse inline with attributes", () => {
      const result = parse("link:example [.external @click=track]");

      expect(result.errors).toHaveLength(0);
      const inline = result.ast.children.find(
        (n) => n.type === "GenericInline",
      );
      if (isGenericInline(inline)) {
        expect(inline.attributes?.classes).toContain("external");
        expect(inline.attributes?.events.click).toBe("track");
      }
    });
  });

  describe("Complex documents", () => {
    it("should parse mixed content", () => {
      const source = `
/* Comment */

:::section [#main]
Text with \${variable}

\`\`\`python
code
\`\`\`
:::
`;

      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children.length).toBeGreaterThan(0);

      const comment = result.ast.children.find(
        (n) => n.type === "CommentBlock",
      );
      expect(comment).toBeDefined();

      const block = result.ast.children.find((n) => n.type === "GenericBlock");
      expect(block).toBeDefined();
    });
  });
});
