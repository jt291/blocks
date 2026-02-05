import { describe, it } from 'vitest';
import { BlocksLexer } from '../src/lexer/lexer';
import { BlocksParser } from '../src/parser/parser';

describe('Debug colon parsing', () => {
  it('should show what tokens are generated', () => {
    const input = `Inline code: This is after the colon.`;
    
    const lexer = new BlocksLexer();
    const result = lexer.tokenize(input);
    
    console.log('\nTokens:');
    result.tokens.forEach((token, i) => {
      console.log(`  ${i}: ${token.tokenType.name} = "${token.image}"`);
    });
    
    const parser = new BlocksParser();
    parser.input = result.tokens;
    
    console.log('\nParsing...');
    try {
      const ast = parser.document();
      console.log('AST:', JSON.stringify(ast, null, 2));
    } catch (e) {
      console.log('Parse exception:', e);
    }
    
    console.log('\nParser errors:', parser.errors.length);
    parser.errors.forEach((err, i) => {
      console.log(`  ${i}:`, err);
    });
  });
});
