import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

describe('Parser', () => {
  describe('Comment blocks', () => {
    it('should parse simple comment block', () => {
      const result = parse('/* comment content */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        content: ' comment content '
      });
    });

    it('should parse comment block with name', () => {
      const result = parse('/* include file.txt */');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentBlock',
        name: 'include',
        content: expect.stringContaining('file.txt')
      });
    });

    it('should parse comment block with attributes', () => {
      const result = parse('/* myname { #id .class } content */');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('CommentBlock');
      expect(node.name).toBe('myname');
      expect(node.attributes).toMatchObject({
        id: 'id',
        classes: ['class']
      });
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
    it('should parse inline comment', () => {
      const result = parse('// this is a comment\n');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CommentInline',
        content: ' this is a comment'
      });
    });
  });

  describe('Inline code', () => {
    it('should parse simple inline code', () => {
      const result = parse('`code`');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeInline',
        content: 'code'
      });
    });

    it('should parse inline code with name', () => {
      const result = parse('`js console.log()`');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'CodeInline',
        name: 'js'
      });
    });

    it('should parse inline code with attributes', () => {
      const result = parse('`code` { .highlight }');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('CodeInline');
      expect(node.attributes?.classes).toContain('highlight');
    });
  });

  describe('Inline scripts', () => {
    it('should parse simple inline script', () => {
      const result = parse('!script!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptInline',
        content: 'script'
      });
    });

    it('should parse inline script with name', () => {
      const result = parse('!js alert()!');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'ScriptInline',
        name: 'js'
      });
    });
  });

  describe('Inline generic', () => {
    it('should parse simple inline generic', () => {
      const result = parse(':text:');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children).toHaveLength(1);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericInline'
      });
    });

    it('should parse inline generic with name', () => {
      const result = parse(':strong bold:');
      
      expect(result.errors).toEqual([]);
      expect(result.ast.children[0]).toMatchObject({
        type: 'GenericInline',
        name: 'strong'
      });
    });

    it('should parse inline generic with attributes', () => {
      const result = parse(':em italic: { .emphasis }');
      
      expect(result.errors).toEqual([]);
      const node = result.ast.children[0];
      expect(node.type).toBe('GenericInline');
      expect(node.name).toBe('em');
      expect(node.attributes?.classes).toContain('emphasis');
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
