import { describe, it } from 'vitest';
import { BlocksLexer } from '../src/lexer/lexer';

describe('Debug tokenization of line 17', () => {
  it('should show tokens', () => {
    const input = `Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.`;
    
    const lexer = new BlocksLexer();
    const result = lexer.tokenize(input);
    
    console.log('\nTokens:');
    result.tokens.forEach((token, i) => {
      console.log(`  ${i}: ${token.tokenType.name} = "${token.image}"`);
    });
  });
});
