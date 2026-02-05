# Preprocessor Documentation

The Blocks preprocessor provides support for `#include` directives, allowing you to include external files in your Blocks content before parsing.

## Features

- **Flexible Syntax**: Use `#include` in comment blocks, code blocks, or script blocks
- **Cross-platform**: Works in both browser (using `fetch`) and Node.js (using `fs`)
- **Relative Paths**: Paths are resolved relative to the file containing the include
- **Error Handling**: Detects circular includes and respects maximum depth limits
- **Caching**: Optional file caching for improved performance

## Usage

### Basic Example

```javascript
import { Preprocessor } from 'blocks';
import * as fs from 'node:fs/promises';

// Initialize the preprocessor
const preprocessor = new Preprocessor({
  basePath: './content',
  maxDepth: 10,
  cache: true
});

// Read and process a file
const content = await fs.readFile('./content/main.blocks', 'utf-8');
const result = await preprocessor.process(content, './content/main.blocks');

console.log(result.content);        // Processed content
console.log(result.includedFiles);  // List of included files
console.log(result.errors);         // Any errors encountered
```

## Syntax

### In Comment Blocks

```blocks
/* #include header.blocks */
```

### In Code Blocks

````blocks
```python
#include utils.py

def main():
    pass
```
````

### In Script Blocks

````blocks
!!!javascript
#include config.js

console.log("Main");
!!!
````

## Path Resolution

### Relative Paths

Paths are always relative to the file containing the `#include`:

```
File: ./content/main.blocks
  → #include header.blocks
  → Resolves to: ./content/header.blocks
  
  → #include ./lib/utils.py
  → Resolves to: ./content/lib/utils.py
  
  → #include ../common.blocks
  → Resolves to: ./common.blocks
```

### Absolute Paths

Absolute paths work as expected in both environments.

## Configuration Options

### `basePath` (required)
Base directory for resolving files. In the browser, this is typically a path like `/public/`. In Node.js, it can be any directory path.

### `maxDepth` (optional, default: 10)
Maximum depth of nested includes to prevent infinite loops.

### `cache` (optional, default: true)
Enable or disable file caching. When enabled, included files are cached in memory and reused on subsequent inclusions.

## Error Handling

The preprocessor handles several types of errors:

- **file_not_found**: The included file doesn't exist
- **circular_include**: A file includes itself directly or indirectly
- **max_depth_exceeded**: The include depth exceeds `maxDepth`
- **read_error**: Generic error reading a file

Errors are non-blocking by default. The `#include` directive remains in the content if an error occurs.

## Example

See `examples/preprocessor/` for a complete working example with demo files.

Run the demo:
```bash
npm run build
node demo-preprocessor.js
```

## Integration with Parser

The preprocessor is designed to run before parsing:

```javascript
import { Preprocessor, parse } from 'blocks';

// 1. Preprocess
const preprocessor = new Preprocessor({ basePath: './' });
const preprocessed = await preprocessor.process(content, filePath);

// 2. Parse
const parseResult = parse(preprocessed.content);

// Access the AST
console.log(parseResult.ast);
```

## Browser Usage

In the browser, the preprocessor uses `fetch` to load files:

```javascript
const preprocessor = new Preprocessor({
  basePath: '/public/content/'
});

// Fetch and process
const response = await fetch('/public/content/main.blocks');
const content = await response.text();
const result = await preprocessor.process(content, '/public/content/main.blocks');
```

## API Reference

### `Preprocessor`

**Constructor:**
- `new Preprocessor(config: PreprocessorConfig)`

**Methods:**
- `process(content: string, currentFile?: string): Promise<PreprocessorResult>`
  - Process content and resolve all `#include` directives
- `clearCache(): void`
  - Clear the file cache

### Types

See `src/preprocessor/types.ts` for complete TypeScript type definitions.
