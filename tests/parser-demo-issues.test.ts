import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

describe('Parser demo issues', () => {
  it('should parse line 20 correctly (code block with attributes)', () => {
    const input = `\`\`\`#python {#example1 .highlight %numbered}
def greet(name):
    return f"Hello, {name}!"
\`\`\``;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
    
    expect(result.errors).toEqual([]);
    expect(result.ast.children[0].type).toBe('CodeBlock');
  });

  it('should parse generic block with 4 colons', () => {
    const input = `::::#outer {.container}
Content
::::`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    
    expect(result.errors).toEqual([]);
    expect(result.ast.children[0].type).toBe('GenericBlock');
  });

  it('should parse nested colons in content', () => {
    const input = `:emphasis:`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
    
    expect(result.errors).toEqual([]);
  });

  it('should parse text with colon in attributes', () => {
    const input = `:::#box {data-value=123 title="Example"}
Content
:::`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    
    expect(result.errors).toEqual([]);
  });
});
