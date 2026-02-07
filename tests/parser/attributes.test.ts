/**
 * Attribute parsing tests
 */

import { describe, it, expect } from "vitest";
import { createLexer } from "../../src/lexer/lexer";
import { parse } from "../../src/parser/visitor";

describe("Parser - Attributes", () => {
  it("should parse ID attribute", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::div {#main}\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block?.attributes?.id).toBe("main");
  });

  it("should parse class attributes", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::div {.container .flex}\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block?.attributes?.classes).toContain("container");
    expect(block?.attributes?.classes).toContain("flex");
  });

  it("should parse option attributes", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::div {%dismissible}\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block?.attributes?.options).toContain("dismissible");
  });

  it("should parse key-value attributes", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::div {lang=fr theme=dark}\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block?.attributes?.keyValues.lang).toBe("fr");
    expect(block?.attributes?.keyValues.theme).toBe("dark");
  });

  it("should parse mixed attributes", () => {
    const lexer = createLexer();
    const { tokens } = lexer.tokenize(":::div {#main .container %dismissible lang=fr}\n:::");
    const ast = parse(tokens);

    const block = ast.children.find((c) => c.type === "GenericBlock");
    expect(block?.attributes?.id).toBe("main");
    expect(block?.attributes?.classes).toContain("container");
    expect(block?.attributes?.options).toContain("dismissible");
    expect(block?.attributes?.keyValues.lang).toBe("fr");
  });
});
