import { describe, it } from 'vitest';
import { parse } from '../src/index';

describe('Debug with proper closing', () => {
  it('should parse lines 15-20 with closing', () => {
    const input = `:::#section {#code-examples .code-section}

Inline code: \`const x = 1\` and named inline code: \`#javascript console.log(x)\`.

Block code with attributes:
\`\`\`#python {#example1 .highlight %numbered}
def greet(name):
    return f"Hello, {name}!"
\`\`\`

:::`;
    
    const result = parse(input);
    console.log('Lines 15-20 with closing - Errors:', result.errors);
  });
});
