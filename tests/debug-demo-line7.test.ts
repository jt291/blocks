import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Debug inline generic in demo', () => {
  it('should parse line 7 correctly', () => {
    const input = `This is a :strong complete demonstration: of the Blocks language.`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  });

  it('should parse lines 6-10', () => {
    const input = `:::#section {#intro .hero}
This is a :strong complete demonstration: of the Blocks language.
It showcases :#span every syntax: available.
:::`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('Children count:', result.ast.children.length);
    if (result.ast.children[0]) {
      console.log('First child type:', result.ast.children[0].type);
    }
  });
});
