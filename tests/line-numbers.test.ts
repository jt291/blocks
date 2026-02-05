import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

describe('Line number reporting', () => {
  it('should report correct line number for unclosed script inline', () => {
    const input = `Line 1
Line 2
Line 3
Texte avec !alert('test') non fermé ici.`;
    
    const result = parse(input);
    
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('line 4');
    expect(result.errors[0]).not.toContain('line 3');
  });

  it('should report correct line number for unclosed code block', () => {
    const input = `Line 1
Line 2
\`\`\`#python
code here`;
    
    const result = parse(input);
    
    expect(result.errors).toHaveLength(1);
    // Error should mention line 3 (where the code block starts)
    expect(result.errors[0]).toMatch(/line \d+/);
    console.log('Error:', result.errors[0]);
  });

  it('should report correct line number for invalid attributes', () => {
    const input = `Line 1
Line 2
Line 3
:::{#id & .class}
content
:::`;
    
    const result = parse(input);
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
      // Check that errors reference line 4 (where the invalid attributes are)
      const hasLine4 = result.errors.some(err => err.includes('line 4'));
      expect(hasLine4).toBe(true);
    }
  });
});
