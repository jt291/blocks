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

1. **Comment Block**: `/* name? attributes? content */`
2. **Code Block**: ` ``` name? attributes? content ``` `
3. **Script Block**: `!!! name? attributes? content !!!`
4. **Generic Block**: `::: name? attributes? content :::`

### Inlines

1. **Comment Inline**: `// content`
2. **Code Inline**: `` ` name? content ` attributes? ``
3. **Script Inline**: `! name? content ! attributes?`
4. **Generic Inline**: `: name? content : attributes?`

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
