import { describe, it } from 'vitest';
import { BlocksLexer } from '../src/lexer/lexer';

describe('Debug line 20', () => {
  it('should tokenize lines around line 20', () => {
    const demo = `/* #metadata Demo showing ALL Blocks syntax features */

:::#document {#main-doc .demo-page %interactive lang=fr}

// Introduction section
:::#section {#intro .hero}
This is a :strong complete demonstration: of the Blocks language.
It showcases :#span every syntax: available.
:::

/* Block comment with name */
/*#note This comment explains the next section */

// Code examples section
:::#section {#code-examples .code-section}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.

Block code with attributes:
\`\`\`#python {#example1 .highlight %numbered}`;

    const lexer = new BlocksLexer();
    const result = lexer.tokenize(demo);
    
    console.log('\n=== All tokens ===');
    result.tokens.forEach((token, i) => {
      console.log(`${i}: Line ${token.startLine} - ${token.tokenType.name}: "${token.image}"`);
    });
  });
});
