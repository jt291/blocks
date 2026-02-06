# Blocks Language Parser

A block-based markup language parser built with TypeScript, Chevrotain, Vite, and Vitest.

## Overview

This project implements a parser for a custom block-based markup language that supports:
- 4 types of blocks (comment, code, script, generic)
- 4 types of inlines (comment, code, script, generic)
- Flexible attribute syntax with IDs, classes, options, and key-value pairs

## File Extension

Blocks language files use the **`.block`** extension.

```bash
# Example files
example.block
template.block
config.block
```

See [LANGUAGE.md](LANGUAGE.md) for complete language specification.

## Syntax Overview

### Blocks

**Generic blocks:**
```blocks
::: blockType #id .class1 .class2 %option1 %option2 key=value
Block content
:::
```

**Code blocks:**
```blocks
``` language #id .class %option key=value
Code content
```
```

**Alternative code blocks:**
```blocks
!!! language #id .class %option key=value
Code content
!!!
```

### Inline Elements

**Format:**
```blocks
inlineType:content[#id .class %option key=value]
```

**Examples:**
```blocks
Code: code:print("hello")[.highlight %copy]
Link: link:https://example.com[#link1 .external]
Emphasis: strong:important text[.urgent]
```

### Variables

**Simple variables:**
```blocks
{varname}
{varname|filter}
{varname|filter:arg1:arg2}
```

**Interpolated variables:**
```blocks
${varname}
${object.property}
${array[0]}
```

### Metadata

**Global metadata (document frontmatter):**
```blocks
---
title: Document Title
author: John Doe
date: 2026-02-06
---
```

**Local metadata (block-level):**
```blocks
::: blockType #id .class
---
key: value
nested:
  property: value
---
Block content
:::
```

📖 **[View Complete Syntax Documentation →](docs/syntax.md)**

📚 **[View Comprehensive Examples →](docs/examples.md)**

🎮 **[Try the Interactive Playground →](public/playground.html)**

## Installation

```bash
pnpm install
```

## Quick Start

```javascript
import { parse } from 'blocks';
import fs from 'fs';

// Parse a .block file
const content = fs.readFileSync('document.block', 'utf-8');
const result = parse(content);

console.log(result.ast);
```

## Usage

```typescript
import { parse } from 'blocks';

// Parse a simple comment block
const result = parse('/* This is a comment */');
console.log(result.ast);

// Parse a code block
const code = parse('```javascript\nfunction hello() {\n  console.log("Hello");\n}\n```');
```

## Language Syntax

### Blocks

1. **Comment Block**: `/* #name? content */`
   - If the first token is `#identifier`, it becomes the **name** of the block
   - The rest is always the **content**
   - **No attributes** for comment blocks
   
   Examples:
   - `/* Simple comment */` → content only
   - `/* #include file.txt */` → name: "include", content: " file.txt "
   - `/* #ifdef DEBUG */` → name: "ifdef", content: " DEBUG "

2. **Code Block**: ` ``` name? attributes? content ``` `
3. **Script Block**: `!!! name? attributes? content !!!`
4. **Generic Block**: `::: name? attributes? content :::`

### Inlines

All inline elements follow a **uniform syntax rule**: if the first token after the opening delimiter (ignoring spaces) is `#identifier`, it becomes the **name** of the inline, otherwise it's **content**.

1. **Comment Inline**: `// #name? content`
   - No attributes
   - Optional name with `#` prefix
   
   Examples:
   ```
   // This is a comment
   // → {type: "CommentInline", content: "This is a comment"}
   
   //#todo Fix this later
   // → {type: "CommentInline", name: "todo", content: " Fix this later"}
   // Note: Leading whitespace after the name is preserved in content
   
   //#note Important detail here
   // → {type: "CommentInline", name: "note", content: " Important detail here"}
   ```

2. **Code Inline**: `` ` #name? content ` attributes? ``
   - Optional attributes after closing delimiter
   - Optional name with `#` prefix
   
   Examples:
   ```
   `console.log()`
   // → {type: "CodeInline", content: "console.log()"}
   
   `#js console.log()`
   // → {type: "CodeInline", name: "js", content: " console.log()"}
   
   `#js code here`{.highlight}
   // → {type: "CodeInline", name: "js", content: " code here", attributes: {classes: ["highlight"]}}
   
   `const x = 1`{#code1 .javascript}
   // → {type: "CodeInline", content: "const x = 1", attributes: {id: "code1", classes: ["javascript"]}}
   ```

3. **Script Inline**: `! #name? content ! attributes?`
   - Optional attributes after closing delimiter
   - Optional name with `#` prefix
   
   Examples:
   ```
   !alert("Hello")!
   // → {type: "ScriptInline", content: "alert(\"Hello\")"}
   
   !#py print("Hello")!
   // → {type: "ScriptInline", name: "py", content: " print(\"Hello\")"}
   
   !#js getValue()!{#script1}
   // → {type: "ScriptInline", name: "js", content: " getValue()", attributes: {id: "script1"}}
   
   !compute()!{.external}
   // → {type: "ScriptInline", content: "compute()", attributes: {classes: ["external"]}}
   ```

4. **Generic Inline**: `: #name? content : attributes?`
   - Optional attributes after closing delimiter
   - Optional name with `#` prefix
   - Can contain nested inlines
   
   Examples:
   ```
   :bold text:
   // → {type: "GenericInline", content: [text nodes]}
   
   :#link GitHub:
   // → {type: "GenericInline", name: "link", content: [text nodes]}
   
   :#link GitHub:{href="https://github.com"}
   // → {type: "GenericInline", name: "link", content: [text nodes], attributes: {keyValues: {href: "..."}}}
   
   :text with `code`::{.highlight}
   // → {type: "GenericInline", content: [text and inline nodes], attributes: {classes: ["highlight"]}}
   ```

### Attributes

Format: `{ #id .class1 .class2 %option1 %option2 key1=val1 key2=val2 }`

### Nested Generic Blocks

Generic blocks support nesting using delimiters of **different lengths**. Inner blocks must use **strictly more** delimiter characters than their parent blocks.

**Syntax convention**: Similar to Markdown fenced code blocks

```
:::           (outer block: 3 colons)
  outer content
  
  :::::       (inner block: 5 colons)
    inner content
  :::::
:::
```

**Rule**: An inner block must have more delimiter characters than its parent.

**Examples**:

```
# Simple nesting with names
:::#container
  Some text here
  
  :::::#inner
    Nested content
  :::::
  
  Back to outer
:::

# Multiple levels
:::
  Level 1
  :::::
    Level 2
    :::::::
      Level 3
    :::::::
  :::::
:::

# With attributes
:::{.outer-class}
  Content with `inline code`
  
  :::::{#inner-id .inner-class}
    Nested block with different styling
  :::::
:::
```

**Valid delimiter sequences**: `:`, `::`, `:::`, `::::`, `:::::`, ... (3 or more for blocks)

The parser matches opening and closing delimiters by **exact length only**, allowing nested blocks with longer delimiters to be parsed as content of outer blocks.

## Development

```bash
# Build
pnpm build

# Build with playground
pnpm build:playground

# Test
pnpm test

# Watch tests
pnpm test:watch

# Type check
pnpm lint
```

## Interactive Playground

The repository includes an interactive playground (`playground.html`) for testing the Blocks language in real-time.

### Features

- **Live Editor**: Write and edit Blocks code with automatic parsing (300ms debounce)
- **Interactive AST Viewer**: 
  - Collapsible/expandable tree structure
  - Color-coded node types
  - Shows node metadata (names, IDs, classes)
  - Content preview for string values
  - Child count for container nodes
- **Error Display**: Visual feedback for parsing errors
- **Control Buttons**:
  - Expand All: Open all tree nodes
  - Collapse All: Close all tree nodes  
  - Copy JSON: Copy the full AST to clipboard

### Usage

1. Build the project (including the playground bundle):
   ```bash
   npm run build:playground
   ```

2. Open `playground.html` in a web browser

3. Start editing code in the left panel and see the AST update in real-time on the right

The playground uses `dist/playground.js` which includes all dependencies bundled together.

## License

MIT
