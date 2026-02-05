import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Debug full demo step by step', () => {
  it('should parse up to line 15', () => {
    const input = `/* #metadata Demo showing ALL Blocks syntax features */

:::#document {#main-doc .demo-page %interactive lang=fr}

// Introduction section
:::#section {#intro .hero}
This is a :strong complete demonstration: of the Blocks language.
It showcases :#span every syntax: available.
:::

/* Block comment with name */
/*#note This comment explains the next section */

// Code examples section
:::#section {#code-examples .code-section}`;
    
    const result = parse(input);
    console.log('Errors:', result.errors);
    if (result.errors.length > 0) {
      console.log('FAILED at line 15 or before');
    } else {
      console.log('SUCCESS - lines 1-15 parse correctly');
    }
  });

  it('should parse up to line 20', () => {
    const input = `/* #metadata Demo showing ALL Blocks syntax features */

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
    
    const result = parse(input);
    console.log('\nErrors:', result.errors);
    if (result.errors.length > 0) {
      console.log('FAILED at line 20 or before');
    } else {
      console.log('SUCCESS - lines 1-20 parse correctly');
    }
  });
});
