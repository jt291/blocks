import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Debug colon in generic block', () => {
  it('should parse colon followed by whitespace inside generic block', () => {
    const input = `:::#section {#test}
Inline code: \`const x = 1\` and more.
:::`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  });
});
