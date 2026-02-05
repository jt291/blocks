import { describe, it } from 'vitest';
import { BlocksLexer } from '../src/lexer/lexer';
import { BlocksParser } from '../src/parser/parser';

describe('Debug parser state', () => {
  it('should parse line 17 inside generic block', () => {
    const input = `:::#section {#code-examples}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.

:::`;
    
    const lexer = new BlocksLexer();
    const lexResult = lexer.tokenize(input);
    
    console.log('\n=== All tokens ===');
    lexResult.tokens.forEach((token, i) => {
      const indicator = (token.tokenType.name === 'InlineGenericDelim') ? ' <<<' : '';
      console.log(`  ${i}: Line ${token.startLine} - ${token.tokenType.name} = "${token.image}"${indicator}`);
    });
    
    const parser = new BlocksParser();
    parser.input = lexResult.tokens;
    
    console.log('\n=== Parsing ===');
    try {
      const ast = parser.document();
      console.log('Success! AST children:', ast.length);
    } catch (e) {
      console.log('Exception:', e.message);
    }
    
    if (parser.errors.length > 0) {
      console.log('\n=== Parser errors ===');
      parser.errors.forEach(err => {
        console.log(err);
      });
    }
  });
});
