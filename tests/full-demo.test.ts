import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

describe('Full demo parsing - Issue #debug-parser', () => {
  it('should parse the complete demo without errors', () => {
    const demoComplete = `/* #metadata Demo showing ALL Blocks syntax features */

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
\`\`\`#python {#example1 .highlight %numbered}
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

Code with different length delimiters:
\`\`\`\`\`
Code with 5 backticks
\`\`\`\`\`

:::

/* Script section */
:::#section {#script-examples}

Inline script: !console.log('Hello')! and named: !#setup initApp()!.

Block script:
!!!#init {.executable}
// Initialize application
const config = {
  theme: 'dark',
  language: 'en'
};
!!!

Script with different delimiter length:
!!!!!
alert('5 exclamation marks');
!!!!!

:::

// Generic blocks with nesting
:::#section {#generic-examples}

Simple generic inline: :emphasis: and named: :#strong Bold text:.

Nested generic blocks with different delimiters:
::::#outer {.container}
Outer level

::::::#inner {#nested %collapsed}
Inner level with :highlight nested inline: content

::::::::#deepest
Deepest level with \`code\` and !script! elements
::::::::
::::::
::::

:::

/* Attributes showcase */
:::#section {#attributes-demo .showcase}

All attribute types:
:::#box {#unique-id .class1 .class2 %option1 %option2 data-value=123 title="Example"}
Content with full attributes
:::

:::

/* Final comments */
//#footer End of demonstration
// Regular inline comment

:::
`;
    
    const result = parse(demoComplete);
    
    // Should parse without any errors
    expect(result.errors).toEqual([]);
    
    // Should have parsed the document with children
    expect(result.ast.children.length).toBeGreaterThan(0);
    
    // The first child should be the metadata comment
    expect(result.ast.children[0].type).toBe('CommentBlock');
  });
});
