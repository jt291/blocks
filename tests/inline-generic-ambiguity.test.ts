import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Inline generic ambiguity', () => {
  it('should parse "code:" as text not inline generic start', () => {
    const input = `Inline code: This is after the colon.`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
    
    // Ideally should have no errors
  });

  it('should parse colon at end of sentence as text', () => {
    const input = `Here is some text: and more text.`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    
    // Should have no errors
  });

  it('should parse actual inline generic correctly', () => {
    const input = `:emphasis:`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    console.log('AST:', JSON.stringify(result.ast, null, 2));
  });
});
