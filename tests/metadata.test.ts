import { describe, expect, it } from "vitest";
import { process } from "../src/index";
import { extractMetadata, parseMetadata } from "../src/metadata/parser";

describe("Metadata Parser", () => {
  describe("parseMetadata", () => {
    it("should parse valid YAML frontmatter", () => {
      const source = `---
title: "My Doc"
author: "Alice"
---

Content here`;

      const result = parseMetadata(source);

      expect(result.hasMetadata).toBe(true);
      expect(result.metadata).toEqual({
        title: "My Doc",
        author: "Alice",
      });
      expect(result.content.trim()).toBe("Content here");
    });

    it("should handle nested objects", () => {
      const source = `---
config:
  theme: "dark"
  version: 1.0
user:
  name: "Bob"
  email: "bob@example.com"
---

Content`;

      const result = parseMetadata(source);

      expect(result.metadata.config).toEqual({
        theme: "dark",
        version: 1.0,
      });
      expect(result.metadata.user.name).toBe("Bob");
    });

    it("should handle arrays", () => {
      const source = `---
items:
  - name: "Product A"
    price: 100
  - name: "Product B"
    price: 200
---

Content`;

      const result = parseMetadata(source);

      expect(result.metadata.items).toHaveLength(2);
      expect(result.metadata.items[0].name).toBe("Product A");
      expect(result.metadata.items[1].price).toBe(200);
    });

    it("should return empty metadata if no frontmatter", () => {
      const source = "Just regular content";

      const result = parseMetadata(source);

      expect(result.hasMetadata).toBe(false);
      expect(result.metadata).toEqual({});
      expect(result.content).toBe(source);
    });

    it("should return empty if only one ---", () => {
      const source = `---
title: "Test"

No closing ---`;

      const result = parseMetadata(source);

      expect(result.hasMetadata).toBe(false);
    });

    it("should handle empty metadata", () => {
      const source = `---
---

Content`;

      const result = parseMetadata(source);

      expect(result.hasMetadata).toBe(true);
      expect(result.metadata).toEqual({});
      expect(result.content.trim()).toBe("Content");
    });

    it("should preserve content whitespace", () => {
      const source = `---
var: value
---

Line 1
Line 2

Line 4`;

      const result = parseMetadata(source);

      expect(result.content).toContain("Line 1\nLine 2\n\nLine 4");
    });
  });

  describe("extractMetadata", () => {
    it("should extract variables and clean source", () => {
      const source = `---
price: 100
quantity: 3
---

Total: \${price * quantity}`;

      const { variables, source: cleanSource } = extractMetadata(source);

      expect(variables).toEqual({ price: 100, quantity: 3 });
      expect(cleanSource).not.toContain("---");
      expect(cleanSource).toContain("Total:");
    });
  });
});

describe("Metadata Integration", () => {
  it("should use metadata variables in expressions", () => {
    const source = `---
price: 100
quantity: 3
---

Total: \${price * quantity}`;

    const result = process(source);

    expect(result.errors).toHaveLength(0);
    expect(result.metadata).toEqual({ price: 100, quantity: 3 });
    expect(result.output).toContain("300");
  });

  it("should support nested object access", () => {
    const source = `---
customer:
  name: "Alice Smith"
  email: "alice@example.com"
---

Customer: \${customer.name}
Email: \${customer.email}`;

    const result = process(source);

    expect(result.output).toContain("Alice Smith");
    expect(result.output).toContain("alice@example.com");
  });

  it("should support array access", () => {
    const source = `---
items:
  - name: "Product A"
    price: 100
  - name: "Product B"
    price: 200
---

Item 1: \${items[0].name} - $\${items[0].price}
Item 2: \${items[1].name} - $\${items[1].price}
Total: $\${items[0].price + items[1].price}`;

    const result = process(source);

    expect(result.output).toContain("Product A");
    expect(result.output).toContain("100");
    expect(result.output).toContain("Product B");
    expect(result.output).toContain("200");
    expect(result.output).toContain("300");
  });

  it("should merge metadata with programmatic variables", () => {
    const source = `---
price: 100
---

Price: \${price}
Quantity: \${quantity}`;

    const result = process(source, {
      variables: { quantity: 5 },
    });

    expect(result.output).toContain("100");
    expect(result.output).toContain("5");
  });

  it("should prioritize programmatic variables over metadata", () => {
    const source = `---
price: 100
---

Price: \${price}`;

    const result = process(source, {
      variables: { price: 200 },
    });

    expect(result.output).toContain("200");
  });

  it("should work without metadata", () => {
    const source = `Price \${price}`;

    const result = process(source, {
      variables: { price: 50 },
    });

    expect(result.output).toContain("50");
  });

  it("should handle complex nested metadata", () => {
    const source = `---
invoice:
  number: "INV-001"
  date: "2024-01-15"
customer:
  name: "Alice"
  email: "alice@example.com"
items:
  - name: "Product A"
    qty: 2
    price: 50
  - name: "Product B"
    qty: 1
    price: 100
---

:::invoice [#\${invoice.number}]
Invoice: \${invoice.number}
Date: \${invoice.date}

Customer: \${customer.name}
Email: \${customer.email}

Items:
- \${items[0].name}: \${items[0].qty} x $\${items[0].price} = $\${items[0].qty * items[0].price}
- \${items[1].name}: \${items[1].qty} x $\${items[1].price} = $\${items[1].qty * items[1].price}

Total: $\${items[0].qty * items[0].price + items[1].qty * items[1].price}
:::`;

    const result = process(source);

    expect(result.errors).toHaveLength(0);
    expect(result.output).toContain("INV-001");
    expect(result.output).toContain("Alice");
    expect(result.output).toContain("Product A");
    expect(result.output).toContain("100");
    expect(result.output).toContain("200");
  });
});
