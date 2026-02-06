# Test Includes for Blocks Playground

This directory contains test files for the `#include` preprocessor directive.

## Files

- **header.blocks** - Document header with metadata
- **footer.blocks** - Document footer with copyright
- **utils.py** - Python utility functions
- **config.js** - JavaScript configuration
- **nested.blocks** - Demonstrates nested includes

## Usage in Playground

```blocks
/* #include header.blocks */

# Your content here

```python
#include utils.py
```

!!!javascript
#include config.js
!!!

/* #include footer.blocks */
```

## Path Resolution

Files are resolved relative to `/public/includes/`:
- `#include header.blocks` → `/public/includes/header.blocks`
- `#include ./lib/helper.py` → `/public/includes/lib/helper.py`
- `#include ../other.blocks` → `/public/other.blocks`
