# Blocks Language Parser

A block-based markup language parser built with TypeScript, Chevrotain, Vite, and Vitest.

## Overview

This project implements a parser for a custom block-based markup language that supports:
- 4 types of blocks (comment, code, script, generic)
- 4 types of inlines (comment, code, script, generic)
- Flexible attribute syntax with IDs, classes, options, and key-value pairs

## Installation

```bash
pnpm install
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

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Watch tests
pnpm test:watch

# Type check
pnpm lint
```

## License

MIT
