import { describe, expect, it } from "vitest";
import { parse, type TextNode } from "../src/index";

describe("Parser", () => {
  describe("Comment blocks", () => {
    it("should parse simple comment block without name", () => {
      const result = parse("/* This is a comment block */");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        content: "This is a comment block ",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse comment block with name starting with #", () => {
      const result = parse("/* #include header.html */");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        name: "include",
        content: "header.html ",
      });
    });

    it("should parse comment block with name and longer content", () => {
      const result = parse("/* #config some important content */");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        name: "config",
        content: "some important content ",
      });
    });

    it("should treat # in middle of content as content", () => {
      const result = parse("/* This has # in the middle */");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        content: "This has # in the middle ",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse multiline comment with name", () => {
      const result = parse("/* #ifdef DEBUG\nsome content\n*/");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentBlock",
        name: "ifdef",
        content: expect.stringContaining("DEBUG"),
      });
    });

    it("should NOT parse attributes in comment blocks", () => {
      const result = parse("/* #config { #id .class } content */");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("CommentBlock");
      expect(node.name).toBe("config");
      expect(node.attributes).toBeUndefined();
      // The { #id .class } are part of the content
      expect(node.content).toContain("{");
      expect(node.content).toContain("#id");
    });
  });

  describe("Code blocks", () => {
    it("should parse simple code block", () => {
      const result = parse("``` code content ```");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        content: "code content ",
      });
    });

    it("should parse code block with name", () => {
      const result = parse('```#javascript\nconsole.log("hello");\n```');

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        name: "javascript",
      });
    });

    it("should parse code block with multiline content", () => {
      const result = parse("```#js\nfunction test() {\n  return 42;\n}\n```");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        name: "js",
        content: expect.stringContaining("function test()"),
      });
    });
  });

  describe("Script blocks", () => {
    it("should parse simple script block", () => {
      const result = parse("!!! script content !!!");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptBlock",
        // Note: Leading space after delimiter is skipped (consistent with new parser behavior)
        content: "script content ",
      });
    });

    it("should parse script block with name", () => {
      const result = parse('!!!#python\nprint("hello")\n!!!');

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptBlock",
        name: "python",
      });
    });
  });

  describe("Generic blocks", () => {
    it("should parse simple generic block", () => {
      const result = parse("::: content :::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
      });
    });

    it("should parse generic block with name", () => {
      const result = parse(":::#div\ntext\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
        name: "div",
      });
    });

    it("should parse generic block with 4 colons", () => {
      const result = parse(":::: content ::::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
      });
    });

    it("should parse generic block with attributes", () => {
      const result = parse(":::#section {#main .container}\ncontent\n:::");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("GenericBlock");
      expect(node.name).toBe("section");
      expect(node.attributes).toMatchObject({
        id: "main",
        classes: ["container"],
      });
    });
  });

  describe("Inline comments", () => {
    it("should parse inline comment without name", () => {
      const result = parse("// This is a comment\n");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentInline",
        content: "This is a comment",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse inline comment with name", () => {
      const result = parse("//#todo Fix this later\n");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentInline",
        name: "todo",
        content: "Fix this later",
      });
    });

    it("should parse inline comment with name and spaces", () => {
      const result = parse("// #note Important detail here\n");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CommentInline",
        name: "note",
        content: "Important detail here",
      });
    });
  });

  describe("Inline code", () => {
    it("should parse simple inline code without name", () => {
      const result = parse("`code`");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeInline",
        content: "code",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse inline code with name", () => {
      const result = parse("`#js console.log()`");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeInline",
        name: "js",
        content: "console.log()",
      });
    });

    it("should parse inline code with attributes", () => {
      const result = parse("`code`{.highlight}");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("CodeInline");
      expect(node.attributes?.classes).toContain("highlight");
    });

    it("should parse inline code with name and attributes", () => {
      const result = parse("`#js code`{.highlight}");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("CodeInline");
      expect(node.name).toBe("js");
      expect(node.content).toBe("code");
      expect(node.attributes?.classes).toContain("highlight");
    });
  });

  describe("Inline scripts", () => {
    it("should parse simple inline script without name", () => {
      const result = parse("!script!");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptInline",
        content: "script",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse inline script with name", () => {
      const result = parse("!#js alert()!");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptInline",
        name: "js",
        content: "alert()",
      });
    });

    it("should parse inline script with attributes", () => {
      const result = parse("!script!{#id1}");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("ScriptInline");
      expect(node.attributes?.id).toBe("id1");
    });

    it("should parse inline script with name and attributes", () => {
      const result = parse("!#py script!{.external}");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("ScriptInline");
      expect(node.name).toBe("py");
      expect(node.content).toBe("script");
      expect(node.attributes?.classes).toContain("external");
    });
  });

  describe("Inline generic", () => {
    it("should parse simple inline generic without name", () => {
      const result = parse(":text:");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericInline",
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it("should parse inline generic with name", () => {
      const result = parse(":#link GitHub:");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericInline",
        name: "link",
      });
    });

    it("should parse inline generic with attributes", () => {
      const result = parse(":text:{.emphasis}");

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("GenericInline");
      expect(node.attributes?.classes).toContain("emphasis");
    });

    it("should parse inline generic with name and attributes", () => {
      const result = parse(':#link GitHub:{href="https://github.com"}');

      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe("GenericInline");
      expect(node.name).toBe("link");
      expect(node.attributes?.keyValues?.href).toBe('"https://github.com"');
    });

    describe("simple cases", () => {
      it("should parse simple generic inline without name or attributes", () => {
        const result = parse(":content:");

        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0]).toMatchObject({
          type: "GenericInline",
        });
        expect(result.ast.children[0].name).toBeUndefined();
        expect(result.ast.children[0].attributes).toBeUndefined();
      });

      it("should parse generic inline with single word", () => {
        const result = parse(":bold:");
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe("GenericInline");
      });

      it("should parse generic inline with multiple words", () => {
        const result = parse(":some text here:");
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe("GenericInline");
      });

      it("should parse empty generic inline", () => {
        const result = parse("::");
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe("GenericInline");
        expect(result.ast.children[0].content).toEqual([]);
      });

      it("should parse generic inline with name but no attributes", () => {
        const result = parse(":#link GitHub:");
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].name).toBe("link");
        expect(result.ast.children[0].attributes).toBeUndefined();
      });

      it("should parse generic inline with nested code inline", () => {
        const result = parse(":text with `code` here:");
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe("GenericInline");
      });
    });
  });

  describe("Text nodes", () => {
    it("should parse plain text", () => {
      const result = parse("simple text");

      expect(result.errors).toEqual([]);
      expect(result.ast.children.length).toBeGreaterThan(0);
      expect(result.ast.children[0].type).toBe("Text");
    });
  });

  describe("Attributes parsing", () => {
    it("should parse ID attribute", () => {
      const result = parse(":::#div {#main-id}\ncontent\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.id).toBe("main-id");
    });

    it("should parse class attributes", () => {
      const result = parse(":::#div {.class1 .class2}\ncontent\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.classes).toEqual([
        "class1",
        "class2",
      ]);
    });

    it("should parse option attributes", () => {
      const result = parse(":::#div {%option1 %option2}\ncontent\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.options).toEqual([
        "option1",
        "option2",
      ]);
    });

    it("should parse key-value attributes", () => {
      const result = parse(":::#div {width=100 height=200}\ncontent\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.keyValues).toEqual({
        width: "100",
        height: "200",
      });
    });

    it("should parse mixed attributes", () => {
      const result = parse(
        ":::#div {#id .class1 .class2 %option key=value}\ncontent\n:::",
      );

      expect(result.errors).toEqual([]);
      const attrs = result.ast.children[0].attributes;
      expect(attrs?.id).toBe("id");
      expect(attrs?.classes).toEqual(["class1", "class2"]);
      expect(attrs?.options).toEqual(["option"]);
      expect(attrs?.keyValues).toEqual({ key: "value" });
    });
  });

  describe("Complex documents", () => {
    it("should parse document with multiple blocks", () => {
      const input = `
/* comment */
::: div
  content
:::
\`\`\` js
code
\`\`\`
`;
      const result = parse(input);

      expect(result.errors).toEqual([]);
      const blocks = result.ast.children.filter(
        (n) =>
          n.type === "CommentBlock" ||
          n.type === "GenericBlock" ||
          n.type === "CodeBlock",
      );
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe("Whitespace handling after name", () => {
    it("should not include space after name in comment block", () => {
      const result = parse("/* #include header.html */");
      expect(result.ast.children[0].content).toBe("header.html ");
    });

    it("should not include space after name in inline comment", () => {
      const result = parse("//#todo Fix later\n");
      expect(result.ast.children[0].content).toBe("Fix later");
    });

    it("should not include space after name in code inline", () => {
      const result = parse("`#js alert()`");
      expect(result.ast.children[0].content).toBe("alert()");
    });

    it("should not include space after name in script inline", () => {
      const result = parse("!#py script!");
      expect(result.ast.children[0].content).toBe("script");
    });

    it("should not include space after name in generic inline", () => {
      const result = parse(":#name content:");
      const firstContent = result.ast.children[0].content[0];
      expect(firstContent.type).toBe("Text");
      expect(firstContent.value).toBe("content");
    });

    it("should preserve spaces within content", () => {
      const result = parse("/* #include my file.txt */");
      expect(result.ast.children[0].content).toBe("my file.txt ");
    });

    it("should handle multiple spaces after name", () => {
      const result = parse("`#js    alert()`");
      expect(result.ast.children[0].content).toBe("alert()");
    });

    it("should handle tab after name", () => {
      const result = parse("`#js\talert()`");
      expect(result.ast.children[0].content).toBe("alert()");
    });
  });

  describe("Code blocks with #name and attributes", () => {
    it("should parse code block with #name", () => {
      const result = parse("```#javascript\nconst x = 1;\n```");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        name: "javascript",
        content: "const x = 1;\n",
      });
    });

    it("should parse code block with #name and attributes", () => {
      const result = parse("```#html {#code1 .highlight}\n<p>content</p>\n```");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        name: "html",
        content: "<p>content</p>\n",
        attributes: {
          id: "code1",
          classes: ["highlight"],
        },
      });
    });

    it("should parse code block with attributes but no #name", () => {
      const result = parse("``` {.highlight}\ncode\n```");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "CodeBlock",
        content: "code\n",
        attributes: {
          classes: ["highlight"],
        },
      });
    });
  });

  describe("Script blocks with #name and attributes", () => {
    it("should parse script block with #name", () => {
      const result = parse('!!!#python\nprint("hello")\n!!!');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptBlock",
        name: "python",
        content: 'print("hello")\n',
      });
    });

    it("should parse script block with #name and attributes", () => {
      const result = parse('!!!#python {#script1}\nprint("hello")\n!!!');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptBlock",
        name: "python",
        content: 'print("hello")\n',
        attributes: {
          id: "script1",
        },
      });
    });

    it("should parse script block with attributes but no #name", () => {
      const result = parse("!!! {#script1}\nalert();\n!!!");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "ScriptBlock",
        content: "alert();\n",
        attributes: {
          id: "script1",
        },
      });
    });
  });

  describe("Generic blocks with #name and attributes", () => {
    it("should parse generic block with #name", () => {
      const result = parse(":::#container\ncontent\n:::");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
        name: "container",
      });
    });

    it("should parse generic block with #name and attributes", () => {
      const result = parse(":::#section {#main .wrapper}\ncontent\n:::");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
        name: "section",
        attributes: {
          id: "main",
          classes: ["wrapper"],
        },
      });
    });

    it("should parse generic block with attributes but no #name", () => {
      const result = parse("::: {.highlight}\ncontent\n:::");
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: "GenericBlock",
        attributes: {
          classes: ["highlight"],
        },
      });
    });
  });

  describe("Generic blocks with HTML/XML content", () => {
    it("should parse generic block with simple HTML", () => {
      const result = parse(":::\n<p> content </p>\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      const block = result.ast.children[0];
      expect(block.type).toBe("GenericBlock");
      expect(block.content.length).toBeGreaterThan(0);
      // Check that HTML tags are preserved
      const contentValues = block.content.map((n) => n.value).join("");
      expect(contentValues).toContain("<p>");
      expect(contentValues).toContain("</p>");
    });

    it("should parse generic block with named HTML", () => {
      const result = parse(":::#html\n<p>content</p>\n:::");

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      expect(block.type).toBe("GenericBlock");
      expect(block.name).toBe("html");
      const contentValues = block.content.map((n) => n.value).join("");
      expect(contentValues).toContain("<p>");
      expect(contentValues).toContain("content");
      expect(contentValues).toContain("</p>");
    });

    it("should parse generic block with HTML and attributes", () => {
      const result = parse(":::#html {#id .class1}\n<p>content</p>\n:::");

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      expect(block).toMatchObject({
        type: "GenericBlock",
        name: "html",
        attributes: {
          id: "id",
          classes: ["class1"],
        },
      });
      const contentValues = block.content.map((n) => n.value).join("");
      expect(contentValues).toContain("<p>");
    });

    it("should parse generic block with HTML attributes in tags", () => {
      const result = parse(
        ':::\n<div class="test" id="main">\n  <p>text</p>\n</div>\n:::',
      );

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      expect(block.type).toBe("GenericBlock");
      const contentValues = block.content.map((n) => n.value).join("");
      expect(contentValues).toContain("<div");
      expect(contentValues).toContain("class=");
      expect(contentValues).toContain("id=");
      expect(contentValues).toContain("</div>");
    });

    it("should parse generic block with self-closing tags", () => {
      const result = parse(':::\n<img src="test.jpg" />\n:::');

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      const contentValues = block.content.map((n) => n.value).join("");
      expect(contentValues).toContain("<img");
      expect(contentValues).toContain("/>");
    });

    it("should parse generic block with mixed content", () => {
      const result = parse(
        ":::#container\ntext with `code` and <strong>HTML</strong>\n:::",
      );

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      expect(block.type).toBe("GenericBlock");
      expect(block.name).toBe("container");
      // Should contain text nodes, code inline, and HTML characters
      expect(block.content.length).toBeGreaterThan(0);
      // Check for code inline
      const hasCodeInline = block.content.some((n) => n.type === "CodeInline");
      expect(hasCodeInline).toBe(true);
      // Check for HTML tags in text nodes
      const contentValues = block.content.map((n) => n.value || "").join("");
      expect(contentValues).toContain("<strong>");
      expect(contentValues).toContain("</strong>");
    });

    it("should parse nested generic blocks with HTML", () => {
      const result = parse(":::::\n:::#inner\n<p>content</p>\n:::\n:::::");

      // Now supports nested generic blocks with different delimiter lengths
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);

      const outerBlock = result.ast.children[0];
      expect(outerBlock.type).toBe("GenericBlock");

      // Find the inner block
      const innerBlock = outerBlock.content.find(
        (node) => node.type === "GenericBlock",
      );
      expect(innerBlock).toBeDefined();
      expect(innerBlock.name).toBe("inner");
    });
  });

  describe("Nested generic blocks with different delimiter lengths", () => {
    it("should parse nested generic blocks with longer inner delimiters", () => {
      const result = parse(":::\nouter\n:::::\ninner\n:::::\n:::");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);

      const outerBlock = result.ast.children[0];
      expect(outerBlock.type).toBe("GenericBlock");
      expect(outerBlock.content.length).toBeGreaterThan(0);

      // Find the inner block
      const innerBlock = outerBlock.content.find(
        (node) => node.type === "GenericBlock",
      );
      expect(innerBlock).toBeDefined();
    });

    it("should parse multiple levels of nesting", () => {
      const result = parse(
        ":::\nlevel 1\n:::::\nlevel 2\n:::::::\nlevel 3\n:::::::\n:::::\n:::",
      );

      expect(result.errors).toEqual([]);
      const level1 = result.ast.children[0];
      expect(level1.type).toBe("GenericBlock");

      // Find level 2
      const level2 = level1.content.find(
        (node) => node.type === "GenericBlock",
      );
      expect(level2).toBeDefined();

      // Find level 3
      const level3 = level2.content.find(
        (node) => node.type === "GenericBlock",
      );
      expect(level3).toBeDefined();
    });

    it("should parse nested blocks with names", () => {
      const result = parse(
        ":::#outer\ntext\n:::::#inner\ninner text\n:::::\n:::",
      );

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.name).toBe("outer");

      const inner = outer.content.find((node) => node.type === "GenericBlock");
      expect(inner).toBeDefined();
      expect(inner.name).toBe("inner");
    });

    it("should parse nested blocks with attributes", () => {
      const result = parse(
        ":::{.outer}\ntext\n:::::{.inner}\ninner text\n:::::\n:::",
      );

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.attributes.classes).toContain("outer");

      const inner = outer.content.find((node) => node.type === "GenericBlock");
      expect(inner).toBeDefined();
      expect(inner.attributes.classes).toContain("inner");
    });

    it("should parse complex nested structure", () => {
      const result = parse(`:::
du texte

:::::
et un autre bloc
:::::

encore du texte
:::`);

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.type).toBe("GenericBlock");

      // Should contain text and a nested block
      const hasNestedBlock = outer.content.some(
        (node) => node.type === "GenericBlock",
      );
      expect(hasNestedBlock).toBe(true);
    });

    it("should handle mixed content with nested blocks", () => {
      const result = parse(`:::#container
text with \`code\`

:::::#inner
nested content
:::::

more text
:::`);

      expect(result.errors).toEqual([]);
      const container = result.ast.children[0];
      expect(container.name).toBe("container");

      // Should contain text, code inline, and nested block
      const hasCodeInline = container.content.some(
        (node) => node.type === "CodeInline",
      );
      const hasNestedBlock = container.content.some(
        (node) => node.type === "GenericBlock",
      );
      expect(hasCodeInline).toBe(true);
      expect(hasNestedBlock).toBe(true);
    });

    it("should parse nested blocks at the same level as siblings", () => {
      const result = parse(`::::
::: first inner :::
::: second inner :::
::::`);

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.type).toBe("GenericBlock");

      // Should contain two nested blocks
      const innerBlocks = outer.content.filter(
        (node) => node.type === "GenericBlock",
      );
      expect(innerBlocks.length).toBe(2);
    });

    it("should correctly match delimiters by exact length", () => {
      const result = parse(
        ":::\nouter\n::::\nmiddle (should not close outer)\n::::\n:::",
      );

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.type).toBe("GenericBlock");

      // The :::: block should be nested inside :::
      const innerBlock = outer.content.find(
        (node) => node.type === "GenericBlock",
      );
      expect(innerBlock).toBeDefined();
    });
  });

  describe("Text node merging", () => {
    it("should merge consecutive Text nodes", () => {
      const result = parse("hello world");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toEqual({
        type: "Text",
        value: "hello world",
      });
    });

    it("should merge Text nodes around inlines", () => {
      const result = parse("text1 `code` text2");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(3);
      expect(result.ast.children[0]).toEqual({
        type: "Text",
        value: "text1 ",
      });
      expect(result.ast.children[1].type).toBe("CodeInline");
      expect(result.ast.children[2]).toEqual({
        type: "Text",
        value: "text2",
      });
    });

    it("should merge Text nodes in generic blocks", () => {
      const result = parse(":::\nhello world\n:::");

      expect(result.errors).toEqual([]);
      const block = result.ast.children[0];
      expect(block.type).toBe("GenericBlock");

      // Should have merged Text nodes - expect only 1 text node instead of many
      const textNodes = block.content.filter((n) => n.type === "Text");
      expect(textNodes.length).toBe(1);
      expect(textNodes[0].value).toBe("hello world\n");
    });

    it("should merge Text nodes recursively in nested blocks", () => {
      const result = parse(":::\ntext\n:::::\ninner text\n:::::\n:::");

      expect(result.errors).toEqual([]);
      const outer = result.ast.children[0];
      expect(outer.type).toBe("GenericBlock");

      const inner = outer.content.find((n) => n.type === "GenericBlock");
      expect(inner).toBeDefined();

      // Check that inner block also has merged text
      const innerTextNodes = inner.content.filter((n) => n.type === "Text");
      expect(innerTextNodes.length).toBe(1);
      expect(innerTextNodes[0].value).toContain("inner text");
    });

    it("should preserve non-consecutive Text nodes", () => {
      const result = parse("text `code` more");

      expect(result.errors).toEqual([]);
      // Should have 3 nodes: Text, CodeInline, Text
      expect(result.ast.children).toHaveLength(3);

      // First and last should be Text nodes (but separate, not merged)
      expect(result.ast.children[0].type).toBe("Text");
      expect(result.ast.children[1].type).toBe("CodeInline");
      expect(result.ast.children[2].type).toBe("Text");
    });

    it("should handle multiple inline elements with text between them", () => {
      const result = parse("start `code1` middle `code2` end");

      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(5);

      // Text, Code, Text, Code, Text pattern
      expect(result.ast.children[0].type).toBe("Text");
      expect(result.ast.children[1].type).toBe("CodeInline");
      expect(result.ast.children[2].type).toBe("Text");
      expect(result.ast.children[3].type).toBe("CodeInline");
      expect(result.ast.children[4].type).toBe("Text");
    });
  });

  describe("Error messages", () => {
    it("should provide clear error message for unclosed code block", () => {
      const result = parse("```javascript\nconst x = 1;\n");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Parse error at line");
      expect(result.errors[0]).toContain("Expected closing backticks");
      expect(result.errors[0]).toContain("code block");
    });

    it("should provide clear error message for unclosed script block", () => {
      const result = parse('!!!\nalert("test");\n');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Parse error at line");
      expect(result.errors[0]).toContain("Expected closing exclamation marks");
      expect(result.errors[0]).toContain("script block");
    });

    it("should provide clear error message for code block length mismatch", () => {
      const result = parse("```\ncode\n````");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("delimiter length mismatch");
      expect(result.errors[0]).toContain("backtick");
    });

    it("should provide clear error message for script block length mismatch", () => {
      const result = parse("!!!\nscript\n!!!!");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("delimiter length mismatch");
      expect(result.errors[0]).toContain("exclamation mark");
    });

    it("should provide clear error message for unclosed inline code", () => {
      const result = parse("Text with `unclosed code");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Parse error at line");
      expect(result.errors[0]).toContain("Expected closing backtick");
      expect(result.errors[0]).toContain("inline code");
    });

    it("should provide clear error message for unclosed inline script", () => {
      const result = parse("Text with !unclosed script");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Parse error at line");
      expect(result.errors[0]).toContain("Expected closing exclamation mark");
      expect(result.errors[0]).toContain("inline script");
    });

    it("should treat unclosed colon as text, not inline generic", () => {
      const result = parse("Text with :unclosed generic");

      // With lookahead, this is treated as text, not an error
      expect(result.errors).toHaveLength(0);
      expect(result.ast.children.length).toBeGreaterThan(0);
      // The colon should be treated as text
      const textContent = result.ast.children
        .filter((c) => c.type === "Text")
        .map((c) => (c as TextNode).value)
        .join("");
      expect(textContent).toContain(":");
    });

    it("should provide specific error for generic block length mismatch", () => {
      const result = parse(":::\nContent\n:::::");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Generic block closing delimiter length mismatch",
      );
      expect(result.errors[0]).toContain("expected 3 colons");
      expect(result.errors[0]).toContain("got 5");
    });

    it("should not report errors for properly closed blocks", () => {
      const result = parse("```\ncode\n```");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].type).toBe("CodeBlock");
    });

    it("should not report errors for properly closed script blocks", () => {
      const result = parse("!!!\nscript\n!!!");

      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].type).toBe("ScriptBlock");
    });
  });

  // New tests for inline generic delimiter fixes
  describe("Inline generic delimiter fixes", () => {
    it("should not confuse code blocks with inline generics", () => {
      const input = '```#python\nprint("Hello")\n```';

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("CodeBlock");
      expect(result.ast.children[0].name).toBe("python");
    });

    it("should not confuse code blocks with colons in content", () => {
      const input =
        "```#python {#example1 .highlight %numbered}\nkey: value\nother: data\n```";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("CodeBlock");
      expect(result.ast.children[0].name).toBe("python");
      expect(result.ast.children[0].content).toContain("key: value");
    });

    it("should not confuse script blocks with inline generics", () => {
      const input = "!!!#init\nsetupApp();\n!!!";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("ScriptBlock");
      expect(result.ast.children[0].name).toBe("init");
    });

    it("should not confuse script blocks with colons in content", () => {
      const input = "!!!#init {.executable}\nconst obj = { a: 1, b: 2 };\n!!!";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("ScriptBlock");
      expect(result.ast.children[0].content).toContain("a: 1");
    });

    it("should not confuse generic blocks with inline generics", () => {
      const input = "::::#outer {.container}\nContent here\n::::";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children[0].type).toBe("GenericBlock");
      expect(result.ast.children[0].name).toBe("outer");
    });

    it("should parse valid inline generics correctly", () => {
      const input = "Text with :emphasis: inline.";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children).toHaveLength(3); // Text + GenericInline + Text
      expect(result.ast.children[0].type).toBe("Text");
      expect(result.ast.children[1].type).toBe("GenericInline");
      expect(result.ast.children[2].type).toBe("Text");
    });

    it("should parse multiple inline generics correctly", () => {
      const input = "Text with :emphasis: and :strong: inlines.";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      // Text + GenericInline + Text + GenericInline + Text
      expect(result.ast.children).toHaveLength(5);
      expect(result.ast.children[1].type).toBe("GenericInline");
      expect(result.ast.children[3].type).toBe("GenericInline");
    });

    it("should parse mixed inline types correctly", () => {
      const input = "Text with `code`, !script!, and :generic: inlines.";

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      const types = result.ast.children.map((c) => c.type);
      expect(types).toContain("CodeInline");
      expect(types).toContain("ScriptInline");
      expect(types).toContain("GenericInline");
    });

    it("should treat unclosed colon as text on any line", () => {
      const input = "Line 1\nLine 2\nLine 3\n:unclosed inline";

      const result = parse(input);

      // With lookahead, unclosed colons are treated as text, not errors
      expect(result.errors).toHaveLength(0);
      const textContent = result.ast.children
        .filter((c) => c.type === "Text")
        .map((c) => (c as TextNode).value)
        .join("");
      expect(textContent).toContain(":");
    });

    // New tests for colon punctuation detection
    it("should treat single colon as text, not inline generic", () => {
      const input = "Block code with attributes:";
      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      const textContent = result.ast.children
        .filter((c) => c.type === "Text")
        .map((c) => (c as TextNode).value)
        .join("");
      expect(textContent).toContain("Block code with attributes:");
    });

    it("should treat colon in list items as text", () => {
      const input = "List item: value";
      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      const textContent = result.ast.children
        .filter((c) => c.type === "Text")
        .map((c) => (c as TextNode).value)
        .join("");
      expect(textContent).toContain(":");
    });

    it("should parse valid generic inline correctly", () => {
      const input = "Text with :emphasis: inline.";
      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children).toHaveLength(3); // Text + GenericInline + Text
      expect(result.ast.children[1].type).toBe("GenericInline");
    });

    it("should parse named generic inline", () => {
      const input = "Text with :#span styled: inline.";
      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      const genericInline = result.ast.children.find(
        (c) => c.type === "GenericInline",
      );
      expect(genericInline).toBeDefined();
      expect(genericInline.name).toBe("span");
    });

    it("should handle colon at end of line as text", () => {
      const input = "Title:\nContent here";
      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      // Title: should be text, not start of inline generic
      const textContent = result.ast.children
        .filter((c) => c.type === "Text")
        .map((c) => (c as TextNode).value)
        .join("");
      expect(textContent).toContain("Title:");
    });

    it("should parse the complete demo without errors", () => {
      const input = `Block code with attributes:

\`\`\`#python {#example1 .highlight %numbered}
def greet(name):
    return f"Hello, {name}!"
\`\`\`

Script block with attributes:

!!!#init {.executable}
setupApp();
!!!`;

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      // Should have text nodes and block nodes
      const blocks = result.ast.children.filter(
        (c) => c.type === "CodeBlock" || c.type === "ScriptBlock",
      );
      expect(blocks).toHaveLength(2);
    });

    it("should report correct line number for unclosed code inline", () => {
      const input = "Line 1\nLine 2\n`unclosed code";

      const result = parse(input);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/line 3/i);
      expect(result.errors[0]).toContain("backtick");
    });

    it("should report correct line number for unclosed script inline", () => {
      const input = "Line 1\n!unclosed script";

      const result = parse(input);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/line 2/i);
      expect(result.errors[0]).toContain("exclamation");
    });

    it("should handle demo complète without errors", () => {
      const input = `\`\`\`#python {#example1 .highlight %numbered}
print("Hello")
\`\`\`

!!!#init {.executable}
setupApp();
!!!

::::#outer {.container}
Content
::::`;

      const result = parse(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ast.children).toHaveLength(5); // 3 blocks + 2 newlines/whitespace between

      // Find the actual block elements (not Text nodes)
      const blocks = result.ast.children.filter((c) => c.type !== "Text");
      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe("CodeBlock");
      expect(blocks[1].type).toBe("ScriptBlock");
      expect(blocks[2].type).toBe("GenericBlock");
    });
  });
});
