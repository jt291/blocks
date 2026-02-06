# 🧱 Blocks Playground

Interactive playground for testing the Blocks markup language with real-time preprocessing and parsing.

## Quick Start

### Development Mode
```bash
npm run dev:playground
```
Opens the playground at `http://localhost:3000/playground.html` with hot reload.

### Production Build
```bash
npm run build:playground
```
Builds the playground to `dist/playground.html`.

## Features

### 1. Real-time Preprocessing
The playground integrates the `#include` preprocessor, allowing you to:
- ✅ Include external files (`.blocks`, `.py`, `.js`, etc.)
- ✅ Nest includes (files can include other files)
- ✅ Use relative paths (`./includes/header.blocks`)
- ✅ Cache included files (no duplicate processing)

### 2. Interactive Controls

- **Parse Button**: Process input and display results
- **Pretty Print**: Toggle JSON formatting (2-space indent)
- **Enable Preprocessor**: Toggle preprocessing on/off
- **Auto Process**: Automatically reprocess on text change (500ms debounce)

### 3. Output Display

- **Included Files**: List of all files loaded by preprocessor
- **AST**: JSON representation of parsed document
- **Errors**: Preprocessor and parser error messages
- **Performance**: Processing time in milliseconds

## Include Examples

### Basic Include

```blocks
/* #include header.blocks */

# My Document

Content here...

/* #include footer.blocks */
```

### Code Block Includes

**Python:**
```blocks
```python
#include utils.py

# Use the included functions
result = process_data("hello")
print(format_output(result))
```
```

**JavaScript:**
```blocks
!!!javascript
#include config.js

// Use the included config
console.log(CONFIG.debug);
initConfig();
!!!
```

### Nested Includes

**main.blocks:**
```blocks
#include components.blocks
```

**components.blocks:**
```blocks
#include header.blocks
#include content.blocks
#include footer.blocks
```

All includes are processed recursively and cached automatically.

## Test Files

The `includes/` directory contains example files:

- **header.blocks** - Document header with metadata
- **footer.blocks** - Document footer with copyright
- **utils.py** - Python utility functions
- **config.js** - JavaScript configuration object
- **nested.blocks** - Demonstrates nested includes

## How It Works

### 1. Preprocessing Phase

```
Input with #include directives
         ↓
    Preprocessor
    - Resolves paths (./includes/)
    - Fetches files (fetch API)
    - Detects circular includes
    - Caches processed files
         ↓
    Expanded content
```

### 2. Parsing Phase

```
Preprocessed content
         ↓
     Lexer
    - Tokenizes input
    - Detects block types
         ↓
     Parser
    - Builds AST
    - Validates syntax
         ↓
    JSON AST output
```

## Path Resolution

The preprocessor resolves paths relative to the `basePath` option:

```javascript
const preprocessor = new Preprocessor({
  basePath: './includes/'  // Relative to playground.html
});
```

**Examples:**
- `#include header.blocks` → `./includes/header.blocks`
- `#include ./lib/utils.py` → `./includes/lib/utils.py`
- `#include ../other.blocks` → `./other.blocks`
- `#include /absolute/path.blocks` → `/absolute/path.blocks`
- `#include https://example.com/file.blocks` → (URL as-is)

## Caching Behavior

### Duplicate Includes (Normal)

When the same file is included multiple times:

```blocks
#include utils.py          ← Processed & cached
#include nested.blocks
  └─ #include utils.py    ← Uses cache, not reprocessed
```

**Result**: ✅ No warning, file processed once, cached for subsequent uses

### Circular Includes (Error)

When includes create a loop:

```blocks
A.blocks:
  #include B.blocks

B.blocks:
  #include A.blocks  ← ERROR: Would create infinite loop
```

**Result**: ❌ Error: `Circular include detected: A.blocks (would create infinite loop: A.blocks → B.blocks → A.blocks)`

## Error Handling

The playground displays two types of errors:

### Preprocessor Errors
- **File not found**: `Failed to include missing.blocks: ENOENT: no such file or directory`
- **Circular include**: `Circular include detected: A.blocks (would create infinite loop: ...)`
- **Network error**: `Failed to include: Network request failed`

### Parser Errors
- **Syntax errors**: Line number and description
- **Unclosed blocks**: Missing closing delimiters
- **Invalid tokens**: Unexpected characters

## Performance

Processing times shown in the playground include:
- File fetching (network I/O)
- Preprocessing (include resolution)
- Parsing (AST generation)

Typical times:
- Simple document: 1-5ms
- With includes: 10-50ms (depends on file size and network)
- Complex document: 50-200ms

## Tips

1. **Use relative paths** for portability: `./includes/file.blocks`
2. **Organize includes** in subdirectories: `./includes/components/header.blocks`
3. **Cache-friendly**: Include the same file multiple times without performance penalty
4. **Disable preprocessor** to test raw parsing without includes
5. **Auto process** for live preview while editing

## Troubleshooting

### Files not loading (404 errors)

Check that:
1. Files exist in `public/includes/`
2. File names match exactly (case-sensitive)
3. `basePath` is correct (`./includes/` for relative)

### Circular include error (when not circular)

If you see a circular include error with a detailed include chain, this indicates a true circular dependency where File A includes File B, which includes File A again. This would cause infinite recursion.

If you believe this is incorrect, check the error message which shows the full include chain (e.g., `file1.blocks → file2.blocks → file1.blocks`).

### Parser errors after preprocessing

The preprocessor succeeded but parser failed:
- Check the "Output" panel for preprocessed content
- The syntax error is in the expanded content
- May be in an included file

## Browser Compatibility

The playground uses modern browser APIs:
- ES Modules (`import`/`export`)
- Fetch API (for loading includes)
- Async/await

Requires:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## Development

### File Structure

```
public/
├── playground.html          # Main playground UI
├── includes/                # Test include files
│   ├── header.blocks
│   ├── footer.blocks
│   ├── utils.py
│   ├── config.js
│   └── nested.blocks
└── README.md               # This file

dist/
├── playground.js           # Compiled playground bundle
├── parser/index.js         # Parser module
└── preprocessor/
    ├── index.js           # Preprocessor (Node + Browser)
    └── browser.js         # Preprocessor (Browser only)
```

### Building

```bash
# Build library + playground
npm run build:playground

# Build library only
npm run build

# Watch mode (library)
npm run build -- --watch
```

### Adding Examples

Add new example files to `public/includes/`:

```blocks
# My Example

This is an example file.
```

## Next Steps

- [ ] Add syntax highlighting to input
- [ ] Add HTML formatter to render AST
- [ ] Add export/import functionality
- [ ] Add shareable URLs with encoded content
- [ ] Add more example files
