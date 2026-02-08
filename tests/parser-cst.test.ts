import { describe, expect, it } from "vitest";
import { createLexer } from "../src/lexer/lexer";
import { createParser } from "../src/parser/parser";

describe("Parser CST", () => {
  describe("Basic parsing", () => {
    it("should parse empty document", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
      expect(cst).toBeDefined();
    });

    it("should parse simple text", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("hello world");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
      expect(cst).toBeDefined();
    });

    it("should parse text with special chars", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("Price: $99.99");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Comments", () => {
    it("should parse block comment", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("/* comment */");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse inline comment", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("// comment\n");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Code blocks", () => {
    it("should parse code block with language", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("```python\nprint('hello')\n```");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse code block with attributes", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("```python [#code1 .highlight]\ncode\n```");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Generic blocks", () => {
    it("should parse generic block without name", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize(":::\ncontent\n:::");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse generic block with name", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize(":::section\ncontent\n:::");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse generic block with attributes", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize(":::div [#main .container]\ncontent\n:::");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse nested generic blocks", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize(":::outer\n::::inner\ncontent\n::::\n:::");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Script expressions", () => {
    it("should parse script expression", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("Total: ${price * quantity}");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse multiple script expressions", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("${a} + ${b} = ${a + b}");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse script with property access", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("Name: ${user.name}");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Inline elements", () => {
    it("should parse code inline", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("code`content`");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse generic inline", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("link:https://example.com");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });

    it("should parse inline with attributes", () => {
      const lexer = createLexer();
      const { tokens } = lexer.tokenize("link:example.com [.external @click=track]");
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });

  describe("Mixed content", () => {
    it("should parse document with multiple elements", () => {
      const source = `
/* Comment */

:::section
Text content

\`\`\`python
code here
\`\`\`

Total: \${price}
:::
`;
      
      const lexer = createLexer();
      const { tokens } = lexer.tokenize(source);
      
      const parser = createParser();
      parser.input = tokens;
      const cst = parser.document();
      
      expect(parser.errors).toHaveLength(0);
    });
  });
});
