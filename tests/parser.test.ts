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
        content: ' header.html '
      });
    });

    it('should parse comment block with name and longer content', () => {
      const result = parse('/* #config some important content */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        name: 'config',
        content: ' some important content '
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
        content: ' code content '
      });
    });

    it('should parse code block with name', () => {
      const result = parse('``` javascript console.log("hello"); ```');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeBlock',
        name: 'javascript'
      });
    });

    it('should parse code block with multiline content', () => {
      const result = parse('``` js\nfunction test() {\n  return 42;\n}\n```');
      
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
        content: ' script content '
      });
    });

    it('should parse script block with name', () => {
      const result = parse('!!! python print("hello") !!!');
      
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
      const result = parse('::: div text :::');
      
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
      const result = parse('::: section { #main .container } content :::');
      
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
        content: ' Fix this later'
      });
    });

    it('should parse inline comment with name and spaces', () => {
      const result = parse('// #note Important detail here\n');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentInline',
        name: 'note',
        content: ' Important detail here'
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
        content: ' console.log()'
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
      expect(node.content).toBe(' code');
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
        content: ' alert()'
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
      expect(node.content).toBe(' script');
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
      const result = parse('::: div { #main-id } content :::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.id).toBe('main-id');
    });

    it('should parse class attributes', () => {
      const result = parse('::: div { .class1 .class2 } content :::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.classes).toEqual(['class1', 'class2']);
    });

    it('should parse option attributes', () => {
      const result = parse('::: div { %option1 %option2 } content :::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.options).toEqual(['option1', 'option2']);
    });

    it('should parse key-value attributes', () => {
      const result = parse('::: div { width=100 height=200 } content :::');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0].attributes?.keyValues).toEqual({
        width: '100',
        height: '200'
      });
    });

    it('should parse mixed attributes', () => {
      const result = parse('::: div { #id .class1 .class2 %option key=value } content :::');
      
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
});
