/**
 * Basic parser tests
 */

import { describe, it, expect } from "vitest";
import { createLexer } from "../../src/lexer/lexer";
import { parse } from "../../src/parser/visitor";

describe("Parser - Basic", () => {
  it("should parse empty document", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize("");
    const ast = parse(tokens);

    expect(ast.type).toBe("Document");
    expect(ast.children).toHaveLength(0);
  });

  it("should parse text only", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize("hello world");
    const ast = parse(tokens);

    expect(ast.type).toBe("Document");
    expect(ast.children.length).toBeGreaterThan(0);
  });

  it("should parse code block", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize("```python\nprint('hello')\n```");
    const ast = parse(tokens);

    expect(ast.type).toBe("Document");
    const codeBlock = ast.children.find((c) => c.type === "CodeBlock");
    expect(codeBlock).toBeDefined();
    expect(codeBlock.name).toBe("python");
  });

  it("should parse generic block", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::section\ncontent\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block).toBeDefined();
    expect(block.name).toBe("section");
  });

  it("should parse inline code", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize("code`code`");
    const ast = parse(tokens);

    const inline = ast.children.find((c) => c.type === "CodeInline");
    expect(inline).toBeDefined();
  });
});
