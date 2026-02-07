/**
 * Nesting and structure tests
 */

import { describe, it, expect } from "vitest";
import { createLexer } from "../../src/lexer/lexer";
import { parse } from "../../src/parser/visitor";

describe("Parser - Nesting", () => {
  it("should parse nested blocks", () => {
    const source = `
:::outer
:::inner
content
:::
:::
    `;

    const lexer = createLexer();
    const { tokens } = lexer.tokenize(source);
    const ast = parse(tokens);

    const outer = ast.children.find((c) => c.type === "GenericBlock" && c.name === "outer");
    expect(outer).toBeDefined();

    const inner = outer?.content.find((c) => c.type === "GenericBlock" && c.name === "inner");
    expect(inner).toBeDefined();
  });

  it("should parse inline inside block", () => {
    const source = `
:::section
This is \`inline code\` inside a block.
:::
    `;

    const lexer = createLexer();
    const { tokens } = lexer.tokenize(source);
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block).toBeDefined();

    const hasInline = block?.content.some((c) => c.type === "CodeInline");
    expect(hasInline).toBe(true);
  });
});
