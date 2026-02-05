import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Debug lines 16-20', () => {
  it('should parse line 16 alone', () => {
    const input = ``;
    
    const result = parse(input);
    console.log('Line 16 alone - Errors:', result.errors);
  });

  it('should parse lines 15-17', () => {
    const input = `:::#section {#code-examples .code-section}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.`;
    
    const result = parse(input);
    console.log('Lines 15-17 - Errors:', result.errors);
  });

  it('should parse lines 15-20', () => {
    const input = `:::#section {#code-examples .code-section}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.

Block code with attributes:
\`\`\`#python {#example1 .highlight %numbered}`;
    
    const result = parse(input);
    console.log('Lines 15-20 - Errors:', result.errors);
  });

  it('should parse lines 14-20', () => {
    const input = `// Code examples section
:::#section {#code-examples .code-section}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.

Block code with attributes:
\`\`\`#python {#example1 .highlight %numbered}`;
    
    const result = parse(input);
    console.log('Lines 14-20 - Errors:', result.errors);
  });
});
