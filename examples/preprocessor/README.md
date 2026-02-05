# Preprocessor Example

This example demonstrates the `#include` directive functionality.

## Files

- `main.blocks` - Main file with include directives
- `header.txt` - Included header content
- `utils.py` - Python utility functions
- `config.js` - JavaScript configuration

## Usage

```javascript
import { Preprocessor } from 'blocks';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function main() {
  // Initialize preprocessor
  const preprocessor = new Preprocessor({
    basePath: './examples/preprocessor',
    maxDepth: 10,
    cache: true
  });

  // Read main file
  const mainPath = './examples/preprocessor/main.blocks';
  const content = await fs.readFile(mainPath, 'utf-8');

  // Process includes
  const result = await preprocessor.process(content, mainPath);

  console.log('Processed content:', result.content);
  console.log('Included files:', result.includedFiles);
  console.log('Errors:', result.errors);
}

main();
```

## Output

After processing, `main.blocks` will have all `#include` directives replaced with the actual file contents.
