import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

describe('Parser', () => {
  describe('Comment blocks', () => {
    it('should parse simple comment block without name', () => {
      const result = parse('/* This is a comment block */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        content: 'This is a comment block '
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse comment block with name starting with #', () => {
      const result = parse('/* #include header.html */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        name: 'include',
        content: 'header.html '
      });
    });

    it('should parse comment block with name and longer content', () => {
      const result = parse('/* #config some important content */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        name: 'config',
        content: 'some important content '
      });
    });

    it('should treat # in middle of content as content', () => {
      const result = parse('/* This has # in the middle */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        content: 'This has # in the middle '
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse multiline comment with name', () => {
      const result = parse('/* #ifdef DEBUG\nsome content\n*/');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        name: 'ifdef',
        content: expect.stringContaining('DEBUG')
      });
    });

    it('should NOT parse attributes in comment blocks', () => {
      const result = parse('/* #config { #id .class } content */');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('CommentBlock');
      expect(node.name).toBe('config');
      expect(node.attributes).toBeUndefined();
      // The { #id .class } are part of the content
      expect(node.content).toContain('{');
      expect(node.content).toContain('#id');
    });
  });

  describe('Code blocks', () => {
    it('should parse simple code block', () => {
      const result = parse('``` code content ```');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        content: 'code content '
      });
    });

    it('should parse code block with name', () => {
      const result = parse('```#javascript\nconsole.log("hello");\n```');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        name: 'javascript'
      });
    });

    it('should parse code block with multiline content', () => {
      const result = parse('```#js\nfunction test() {\n  return 42;\n}\n```');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        name: 'js',
        content: expect.stringContaining('function test()')
      });
    });
  });

  describe('Script blocks', () => {
    it('should parse simple script block', () => {
      const result = parse('!!! script content !!!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptBlock',
        // Note: Leading space after delimiter is skipped (consistent with new parser behavior)
        content: 'script content '
      });
    });

    it('should parse script block with name', () => {
      const result = parse('!!!#python\nprint("hello")\n!!!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptBlock',
        name: 'python'
      });
    });
  });

  describe('Generic blocks', () => {
    it('should parse simple generic block', () => {
      const result = parse('::: content :::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock'
      });
    });

    it('should parse generic block with name', () => {
      const result = parse(':::#div\ntext\n:::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock',
        name: 'div'
      });
    });

    it('should parse generic block with 4 colons', () => {
      const result = parse(':::: content ::::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock'
      });
    });

    it('should parse generic block with attributes', () => {
      const result = parse(':::#section {#main .container}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('GenericBlock');
      expect(node.name).toBe('section');
      expect(node.attributes).toMatchObject({
        id: 'main',
        classes: ['container']
      });
    });
  });

  describe('Inline comments', () => {
    it('should parse inline comment without name', () => {
      const result = parse('// This is a comment\n');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentInline',
        content: 'This is a comment'
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse inline comment with name', () => {
      const result = parse('//#todo Fix this later\n');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentInline',
        name: 'todo',
        content: 'Fix this later'
      });
    });

    it('should parse inline comment with name and spaces', () => {
      const result = parse('// #note Important detail here\n');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentInline',
        name: 'note',
        content: 'Important detail here'
      });
    });
  });

  describe('Inline code', () => {
    it('should parse simple inline code without name', () => {
      const result = parse('`code`');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeInline',
        content: 'code'
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse inline code with name', () => {
      const result = parse('`#js console.log()`');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeInline',
        name: 'js',
        content: 'console.log()'
      });
    });

    it('should parse inline code with attributes', () => {
      const result = parse('`code`{.highlight}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('CodeInline');
      expect(node.attributes?.classes).toContain('highlight');
    });

    it('should parse inline code with name and attributes', () => {
      const result = parse('`#js code`{.highlight}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('CodeInline');
      expect(node.name).toBe('js');
      expect(node.content).toBe('code');
      expect(node.attributes?.classes).toContain('highlight');
    });
  });

  describe('Inline scripts', () => {
    it('should parse simple inline script without name', () => {
      const result = parse('!script!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptInline',
        content: 'script'
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse inline script with name', () => {
      const result = parse('!#js alert()!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptInline',
        name: 'js',
        content: 'alert()'
      });
    });

    it('should parse inline script with attributes', () => {
      const result = parse('!script!{#id1}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('ScriptInline');
      expect(node.attributes?.id).toBe('id1');
    });

    it('should parse inline script with name and attributes', () => {
      const result = parse('!#py script!{.external}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('ScriptInline');
      expect(node.name).toBe('py');
      expect(node.content).toBe('script');
      expect(node.attributes?.classes).toContain('external');
    });
  });

  describe('Inline generic', () => {
    it('should parse simple inline generic without name', () => {
      const result = parse(':text:');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericInline'
      });
      expect(result.ast.children[0].name).toBeUndefined();
    });

    it('should parse inline generic with name', () => {
      const result = parse(':#link GitHub:');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericInline',
        name: 'link'
      });
    });

    it('should parse inline generic with attributes', () => {
      const result = parse(':text:{.emphasis}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('GenericInline');
      expect(node.attributes?.classes).toContain('emphasis');
    });

    it('should parse inline generic with name and attributes', () => {
      const result = parse(':#link GitHub:{href="https://github.com"}');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('GenericInline');
      expect(node.name).toBe('link');
      expect(node.attributes?.keyValues?.href).toBe('"https://github.com"');
    });

    describe('simple cases', () => {
      it('should parse simple generic inline without name or attributes', () => {
        const result = parse(':content:');
        
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0]).toMatchObject({
          type: 'GenericInline'
        });
        expect(result.ast.children[0].name).toBeUndefined();
        expect(result.ast.children[0].attributes).toBeUndefined();
      });

      it('should parse generic inline with single word', () => {
        const result = parse(':bold:');
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe('GenericInline');
      });

      it('should parse generic inline with multiple words', () => {
        const result = parse(':some text here:');
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe('GenericInline');
      });

      it('should parse empty generic inline', () => {
        const result = parse('::');
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe('GenericInline');
        expect(result.ast.children[0].content).toEqual([]);
      });

      it('should parse generic inline with name but no attributes', () => {
        const result = parse(':#link GitHub:');
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].name).toBe('link');
        expect(result.ast.children[0].attributes).toBeUndefined();
      });

      it('should parse generic inline with nested code inline', () => {
        const result = parse(':text with `code` here:');
        expect(result.errors).toEqual([]);
        expect(result.ast.children).toHaveLength(1);
        expect(result.ast.children[0].type).toBe('GenericInline');
      });
    });
  });

  describe('Text nodes', () => {
    it('should parse plain text', () => {
      const result = parse('simple text');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children.length).toBeGreaterThan(0);
      expect(result.ast.children[0].type).toBe('Text');
    });
  });

  describe('Attributes parsing', () => {
    it('should parse ID attribute', () => {
      const result = parse(':::#div {#main-id}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.id).toBe('main-id');
    });

    it('should parse class attributes', () => {
      const result = parse(':::#div {.class1 .class2}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.classes).toEqual(['class1', 'class2']);
    });

    it('should parse option attributes', () => {
      const result = parse(':::#div {%option1 %option2}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.options).toEqual(['option1', 'option2']);
    });

    it('should parse key-value attributes', () => {
      const result = parse(':::#div {width=100 height=200}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.keyValues).toEqual({
        width: '100',
        height: '200'
      });
    });

    it('should parse mixed attributes', () => {
      const result = parse(':::#div {#id .class1 .class2 %option key=value}\ncontent\n:::');
      
      expect(result.errors).toEqual([]);
      const attrs = result.ast.children[0].attributes;
      expect(attrs?.id).toBe('id');
      expect(attrs?.classes).toEqual(['class1', 'class2']);
      expect(attrs?.options).toEqual(['option']);
      expect(attrs?.keyValues).toEqual({ key: 'value' });
    });
  });

  describe('Complex documents', () => {
    it('should parse document with multiple blocks', () => {
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
      const blocks = result.ast.children.filter(n => 
        n.type === 'CommentBlock' || n.type === 'GenericBlock' || n.type === 'CodeBlock'
      );
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Whitespace handling after name', () => {
    it('should not include space after name in comment block', () => {
      const result = parse('/* #include header.html */');
      expect(result.ast.children[0].content).toBe('header.html ');
    });

    it('should not include space after name in inline comment', () => {
      const result = parse('//#todo Fix later\n');
      expect(result.ast.children[0].content).toBe('Fix later');
    });

    it('should not include space after name in code inline', () => {
      const result = parse('`#js alert()`');
      expect(result.ast.children[0].content).toBe('alert()');
    });

    it('should not include space after name in script inline', () => {
      const result = parse('!#py script!');
      expect(result.ast.children[0].content).toBe('script');
    });

    it('should not include space after name in generic inline', () => {
      const result = parse(':#name content:');
      const firstContent = result.ast.children[0].content[0];
      expect(firstContent.type).toBe('Text');
      expect(firstContent.value).toBe('content');
    });

    it('should preserve spaces within content', () => {
      const result = parse('/* #include my file.txt */');
      expect(result.ast.children[0].content).toBe('my file.txt ');
    });

    it('should handle multiple spaces after name', () => {
      const result = parse('`#js    alert()`');
      expect(result.ast.children[0].content).toBe('alert()');
    });

    it('should handle tab after name', () => {
      const result = parse('`#js\talert()`');
      expect(result.ast.children[0].content).toBe('alert()');
    });
  });

  describe('Code blocks with #name and attributes', () => {
    it('should parse code block with #name', () => {
      const result = parse('```#javascript\nconst x = 1;\n```');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        name: 'javascript',
        content: 'const x = 1;\n'
      });
    });

    it('should parse code block with #name and attributes', () => {
      const result = parse('```#html {#code1 .highlight}\n<p>content</p>\n```');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        name: 'html',
        content: '<p>content</p>\n',
        attributes: {
          id: 'code1',
          classes: ['highlight']
        }
      });
    });

    it('should parse code block with attributes but no #name', () => {
      const result = parse('``` {.highlight}\ncode\n```');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        content: 'code\n',
        attributes: {
          classes: ['highlight']
        }
      });
    });
  });

  describe('Script blocks with #name and attributes', () => {
    it('should parse script block with #name', () => {
      const result = parse('!!!#python\nprint("hello")\n!!!');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptBlock',
        name: 'python',
        content: 'print("hello")\n'
      });
    });

    it('should parse script block with #name and attributes', () => {
      const result = parse('!!!#python {#script1}\nprint("hello")\n!!!');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptBlock',
        name: 'python',
        content: 'print("hello")\n',
        attributes: {
          id: 'script1'
        }
      });
    });

    it('should parse script block with attributes but no #name', () => {
      const result = parse('!!! {#script1}\nalert();\n!!!');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptBlock',
        content: 'alert();\n',
        attributes: {
          id: 'script1'
        }
      });
    });
  });

  describe('Generic blocks with #name and attributes', () => {
    it('should parse generic block with #name', () => {
      const result = parse(':::#container\ncontent\n:::');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock',
        name: 'container'
      });
    });

    it('should parse generic block with #name and attributes', () => {
      const result = parse(':::#section {#main .wrapper}\ncontent\n:::');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock',
        name: 'section',
        attributes: {
          id: 'main',
          classes: ['wrapper']
        }
      });
    });

    it('should parse generic block with attributes but no #name', () => {
      const result = parse('::: {.highlight}\ncontent\n:::');
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericBlock',
        attributes: {
          classes: ['highlight']
        }
      });
    });
  });
});
