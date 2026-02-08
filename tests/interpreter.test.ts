import { describe, expect, it } from "vitest";
import { evaluate, parse, process, render } from "../src/index";

describe("Interpreter", () => {
  describe("Script evaluation", () => {
    it("should evaluate simple arithmetic", () => {
      const { ast } = parse("Result ${a+b}");
      const evaluated = evaluate(ast, {
        variables: { a: 2, b: 2 },
      });

      const script = evaluated.children.find((n) => n.type === "Script");
      expect(script).toBeDefined();
      expect((script as any).evaluated).toBe(true);
      expect((script as any).result).toBe(4);
    });

    it("should evaluate with variables", () => {
      const { ast } = parse("Total ${price * quantity}");
      const evaluated = evaluate(ast, {
        variables: { price: 10, quantity: 5 },
      });

      const script = evaluated.children.find((n) => n.type === "Script");
      expect((script as any).result).toBe(50);
    });

    it("should evaluate property access", () => {
      const { ast } = parse("Name ${user.name}");
      const evaluated = evaluate(ast, {
        variables: { user: { name: "Alice" } },
      });

      const script = evaluated.children.find((n) => n.type === "Script");
      expect((script as any).result).toBe("Alice");
    });

    it("should evaluate complex expressions", () => {
      const { ast } = parse("Result ${(a+b)*c}");
      const evaluated = evaluate(ast, {
        variables: { a: 2, b: 3, c: 4 },
      });

      const script = evaluated.children.find((n) => n.type === "Script");
      expect((script as any).result).toBe(20);
    });

    it("should handle errors gracefully", () => {
      const { ast } = parse("Result ${invalidVar}");
      const evaluated = evaluate(ast, { variables: {} });

      const script = evaluated.children.find((n) => n.type === "Script");
      expect((script as any).evaluated).toBe(true);
      expect(String((script as any).result)).toContain("Error");
    });

    it("should evaluate multiple scripts", () => {
      const { ast } = parse("${a} + ${b} = ${a+b}");
      const evaluated = evaluate(ast, {
        variables: { a: 2, b: 3 },
      });

      const scripts = evaluated.children.filter((n) => n.type === "Script");
      expect(scripts).toHaveLength(3);
      expect((scripts[0] as any).result).toBe(2);
      expect((scripts[1] as any).result).toBe(3);
      expect((scripts[2] as any).result).toBe(5);
    });
  });

  describe("Rendering", () => {
    it("should render evaluated scripts", () => {
      const { ast } = parse("Result ${a+b}");
      const evaluated = evaluate(ast, {
        variables: { a: 2, b: 2 },
      });
      const output = render(evaluated);

      expect(output).toContain("4");
      expect(output).toContain("Result");
    });

    it("should render text unchanged", () => {
      const { ast } = parse("Hello world");
      const output = render(ast);

      // Note: text merging combines consecutive text nodes
      expect(output).toContain("Hello");
      expect(output).toContain("world");
    });

    it("should skip comments by default", () => {
      const { ast } = parse("/* comment */ text");
      const output = render(ast);

      expect(output).not.toContain("comment");
      expect(output).toContain("text");
    });

    it("should render code blocks", () => {
      const { ast } = parse("```python\nprint('hello')\n```");
      const output = render(ast);

      expect(output).toContain("print('hello')");
    });

    it("should render generic blocks", () => {
      const { ast } = parse(":::section\ntext\n:::");
      const output = render(ast);

      expect(output).toContain("text");
    });
  });

  describe("Complete process", () => {
    it("should process simple script", () => {
      const result = process("Total ${a+b}", {
        variables: { a: 2, b: 2 },
      });

      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("4");
      expect(result.output).toContain("Total");
    });

    it("should process with variables", () => {
      const result = process("Price $ ${price}, Qty ${qty}, Total ${price*qty}", {
        variables: { price: 10, qty: 5 },
      });

      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("10");
      expect(result.output).toContain("5");
      expect(result.output).toContain("50");
    });

    it("should process complex document", () => {
      const source = `
:::invoice
Customer \${customer.name}

Items
- Product A \${productA}
- Product B \${productB}

Total \${productA+productB}
:::
`;

      const result = process(source, {
        variables: {
          customer: { name: "Alice" },
          productA: 100,
          productB: 200,
        },
      });

      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("Alice");
      expect(result.output).toContain("100");
      expect(result.output).toContain("200");
      expect(result.output).toContain("300");
    });

    it("should handle nested blocks", () => {
      const source = `
:::outer
Value \${x}
::::inner
Double \${x*2}
::::
:::
`;

      const result = process(source, {
        variables: { x: 5 },
      });

      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("5");
      expect(result.output).toContain("10");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty source", () => {
      const result = process("");
      expect(result.errors).toHaveLength(0);
      expect(result.output).toBe("");
    });

    it("should handle source without scripts", () => {
      const result = process("Just plain text");
      expect(result.errors).toHaveLength(0);
      // Note: text merging combines text nodes
      expect(result.output).toContain("Just");
      expect(result.output).toContain("plain");
      expect(result.output).toContain("text");
    });

    it("should handle undefined variables", () => {
      const result = process("Value ${missing}");
      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("Error");
    });

    it("should handle boolean results", () => {
      const result = process("Result ${flag}", {
        variables: { flag: true },
      });
      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("true");
    });

    it("should handle null results", () => {
      const result = process("Result ${value}", {
        variables: { value: null },
      });
      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain("null");
    });
  });
});
