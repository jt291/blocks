# Blocks Language Specification

## File Extension

The official file extension for Blocks language is **`.block`**

### Examples

```
document.block
template.block
layout.block
config.block
page.block
```

### MIME Type

```
text/x-blocks
```

### Usage

Blocks files can contain any combination of:
- Comments (block and inline)
- Code blocks and inlines
- Script blocks and inlines
- Generic blocks and inlines
- Attributes (ID, classes, options, key-value pairs)

### Example File: `example.block`

```block
/* Header template */

:::#header {#main-header .sticky %visible}
  
  ```#html
  <h1>Welcome</h1>
  ```
  
  !!!#init
  initializeHeader();
  !!!
  
:::

/* Main content */

:::#main {.container %responsive}
  
  Content with `inline code` and :emphasis: text.
  
  :::::
  Nested block for sidebar
  :::::
  
:::

/* Footer */

/*#include footer.block */
```

## File Association

### VSCode

To associate `.block` files with syntax highlighting in VSCode, add to your `settings.json`:

```json
{
  "files.associations": {
    "*.block": "blocks"
  }
}
```

### Other Editors

- **Sublime Text**: Add to syntax associations
- **Atom**: Configure grammar for `.block`
- **Vim**: `autocmd BufRead,BufNewFile *.block set filetype=blocks`

## Language Features

### Comments
- Block: `/* ... */`, `/*#name ... */`
- Inline: `// ... //`, `//#name ... //`

### Code
- Block: ` ``` `, ` ```#lang `, ` ```#lang {attrs} `
- Inline: `` `code` ``, `` `#lang code` ``, `` `#lang {attrs}code` ``

### Script
- Block: `!!!`, `!!!#name`, `!!!#name {attrs}`
- Inline: `!script!`, `!#name script!`, `!#name {attrs}script!`

### Generic
- Block: `:::`, `:::#name`, `:::#name {attrs}`
- Inline: `:text:`, `:#name text:`, `:#name {attrs}text:`

### Attributes
- ID: `#identifier`
- Class: `.classname`
- Option: `%option`
- Key-Value: `key=value`

### Nesting
Blocks can be nested using longer delimiters:
```
:::
Outer block
:::::
Inner block (more colons)
:::::
:::
```

## File Naming Conventions

### Recommended Patterns

- `index.block` - Main entry file
- `header.block` - Header template
- `footer.block` - Footer template
- `layout.block` - Layout template
- `config.block` - Configuration
- `*.template.block` - Template files
- `*.partial.block` - Partial/component files

### Examples by Use Case

**Web templates:**
```
layouts/
  ├── main.block
  ├── blog.block
  └── docs.block

partials/
  ├── header.block
  ├── nav.block
  └── footer.block
```

**Documentation:**
```
docs/
  ├── index.block
  ├── getting-started.block
  ├── syntax.block
  └── examples.block
```

**Configuration:**
```
config/
  ├── site.block
  ├── build.block
  └── deploy.block
```

## Parser Usage

```javascript
import { parse } from 'blocks';
import fs from 'fs';

// Read a .block file
const content = fs.readFileSync('document.block', 'utf-8');

// Parse it
const result = parse(content);

if (result.errors.length === 0) {
  console.log('Parsed successfully:', result.ast);
} else {
  console.error('Parse errors:', result.errors);
}
```

## TypeScript Support

The parser includes full TypeScript definitions:

```typescript
import { parse, ParseResult, ASTNode } from 'blocks';

const result: ParseResult = parse(content);
const ast: ASTNode = result.ast;
```

## Browser Usage

```html
<script type="module">
  import { parse } from './dist/index.js';
  
  const result = parse('/* Hello World */');
  console.log(result.ast);
</script>
```

## Contributing

When contributing examples or tests, please use `.block` extension for all example files.
