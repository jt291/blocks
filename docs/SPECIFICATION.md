# Blocks Language - Complete Technical Specification

Version: 1.0  
Date: 2026-02-07

---

## Table of Contents

1. [Overview](#overview)
2. [Workflow Pipeline](#workflow-pipeline)
3. [Node Types](#node-types)
4. [Position and Location](#position-and-location)
5. [Delimiters](#delimiters)
6. [Inline Syntax](#inline-syntax)
7. [Attributes](#attributes)
8. [Metadata](#metadata)
9. [Variables and Filters](#variables-and-filters)
10. [Scripts](#scripts)
11. [Escape System](#escape-system)
12. [Comments](#comments)
13. [Examples](#examples)

---

## Overview

Blocks is a flexible, block-based markup language designed for structured content with rich metadata support. It provides a unified syntax for blocks, inlines, attributes, scripts, and metadata.

### Key Features

- **Clear workflow pipeline**: Preprocessor → Parser → Filter → Interpreter → Postprocessor
- **Unified node types**: Document, Text, Comment, Script, Inline, Block
- **Consistent attribute syntax**: `#id`, `.class`, `?option`, `key=value`, `@event=handler`
- **YAML metadata with filters**: `{var|filter:arg}`
- **JavaScript scripts**: `${expression}`
- **Universal escape system**: `\#`, `\``, `\{`, `\\`, `\:`, `\` (line continuation)
- **Location tracking**: Every node includes source position for error reporting and tooling
- **Event system**: `@event=handler` for HTML event binding

### File Extension

The official file extension is **`.block`** or **`.blocks`**

**MIME Type**: `text/x-blocks`

---

## Workflow Pipeline

```
[Source] → Preprocessor → [Source] → Parser → [AST] → Filter → [AST] → Interpreter → [Target] → Postprocessor → [Target]
```

### Pipeline Stages

#### 1. Preprocessor

**Purpose**: File inclusion via `#include` directive

**Input**: Source code (`.blocks` file)  
**Output**: Expanded source code (all includes resolved)

**Implementation note**: File loading mechanism depends on environment:
- Browser: `fetch()`
- Node.js: `fs.readFile()`

**Syntax**: `#include filename.blocks`

**Example**:
```blocks
#include header.blocks

Main content here

#include footer.blocks
```

**Features**:
- Relative path resolution
- Circular include detection
- Maximum depth limits
- Optional file caching
- Line mapping for error reporting

#### 2. Parser

**Purpose**: Transform source code into Abstract Syntax Tree (AST)

**Input**: Source code string  
**Output**: AST (tree of Node objects)

**Responsibilities**:
- Tokenization (lexical analysis)
- Syntax analysis
- Location tracking (line, column, offset)
- Error detection

**Technology**: Built with Chevrotain parser library

#### 3. Filter

**Purpose**: Transform/modify the AST

**Input**: AST  
**Output**: Modified AST

**Implementation**: TypeScript functions that traverse and modify the tree

**Use cases**:
- Inject global metadata
- Remove/transform specific nodes
- Add computed properties
- Validation
- Custom transformations

**Example**:
```typescript
function addTimestampFilter(ast: DocumentNode): DocumentNode {
  ast.metadata = {
    ...ast.metadata,
    generated_at: new Date().toISOString()
  };
  return ast;
}
```

#### 4. Interpreter

**Purpose**: Generate target code from AST

**Input**: AST  
**Output**: Target code (HTML, Markdown, JSON, etc.)

**Responsibilities**:
- Traverse AST
- Apply metadata substitutions
- Evaluate scripts
- Generate output format

**Example interpreters**:
- HTML interpreter → generates HTML
- Markdown interpreter → generates Markdown
- JSON interpreter → serializes AST to JSON

#### 5. Postprocessor

**Purpose**: Final transformations on target code

**Input**: Target code  
**Output**: Final target code

**Use cases**:
- Minification
- Prettification
- Asset injection
- Code optimization

---

## Node Types

### Base Node Interface

```typescript
export interface Node {
  type: string;
  loc?: Location;
}
```

All nodes inherit from `Node` and include optional location tracking.

### Type Hierarchy

```
Node (base)
├── DocumentNode
├── TextNode
├── CommentNode
│   ├── CommentBlockNode      // /* ... */
│   └── CommentInlineNode     // // ...
├── ScriptNode                // ${ ... }
├── InlineNode
│   ├── CodeInline            // name`...`
│   └── GenericInline         // name:...
└── BlockNode
    ├── CodeBlock             // ``` ... ```
    └── GenericBlock          // ::: ... :::
```

### DocumentNode

```typescript
export interface DocumentNode extends Node {
  type: "Document";
  loc?: Location;
  metadata?: Metadata;
  children: (BlockNode | InlineNode | ScriptNode | TextNode | CommentNode)[];
}
```

Root node of the AST. Contains optional metadata and child nodes.

**Example**:
```blocks
---
title: My Document
author: John Doe
---

Content goes here
```

### TextNode

```typescript
export interface TextNode extends Node {
  type: "Text";
  loc?: Location;
  value: string;
}
```

Represents plain text content.

**Example**:
```blocks
Hello world
```

### CommentNode

Base interface for comments:

```typescript
export interface CommentNode extends Node {
  type: "CommentNode";
  loc?: Location;
  content: string;
}
```

#### CommentBlockNode

Multi-line comments:

```typescript
export interface CommentBlockNode extends CommentNode {
  type: "CommentBlock";
  loc?: Location;
  content: string;
}
```

**Syntax**: `/* content */`

**Example**:
```blocks
/* This is a
   multi-line comment */
```

**With name**:
```blocks
/* #include file.txt */
/* #ifdef DEBUG */
```

#### CommentInlineNode

Single-line comments:

```typescript
export interface CommentInlineNode extends CommentNode {
  type: "CommentInline";
  loc?: Location;
  content: string;
}
```

**Syntax**: `// content` (until end of line)

**Example**:
```blocks
// This is a single-line comment
// #todo Fix this later
```

### ScriptNode

JavaScript expressions:

```typescript
export interface ScriptNode extends Node {
  type: "Script";
  loc?: Location;
  content: string;
  evaluated?: boolean;
  result?: any;
}
```

**Syntax**: `${ javascript_expression }`

**Example**:
```blocks
Total: ${price * quantity} EUR
Random: ${Math.random() > 0.5 ? "heads" : "tails"}
Current year: ${new Date().getFullYear()}
```

### InlineNode

Base interface for inline elements:

```typescript
export interface InlineNode extends Node {
  type: "InlineNode";
  loc?: Location;
  name: string;
  attributes?: Attributes;
  content: (InlineNode | ScriptNode | TextNode)[];
}
```

#### CodeInline

Inline code with backtick delimiter:

```typescript
export interface CodeInline extends InlineNode {
  type: "CodeInline";
  loc?: Location;
  name: string;
  attributes?: Attributes;
  content: (ScriptNode | TextNode)[];
}
```

**Syntax**: `` name`content`[attributes] ``

**Example**:
```blocks
code:`print("hello")`[.highlight ?copy]
js:`const x = 1`[#code1 .javascript]
```

#### GenericInline

Generic inline elements with colon separator:

```typescript
export interface GenericInline extends InlineNode {
  type: "GenericInline";
  loc?: Location;
  name: string;
  attributes?: Attributes;
  content: (InlineNode | ScriptNode | TextNode)[];
}
```

**Syntax**: `name:content[attributes]`

**Examples**:
```blocks
link:https://example.com[.external @click=track]
strong:important text[.urgent]
span:custom content[#id .class]
em:emphasized[.italic]
```

### BlockNode

Base interface for block-level elements:

```typescript
export interface BlockNode extends Node {
  type: "BlockNode";
  loc?: Location;
  name?: string;
  attributes?: Attributes;
  metadata?: Metadata;
  content: (InlineNode | ScriptNode | TextNode | BlockNode | CommentNode)[];
}
```

#### CodeBlock

Code blocks with syntax highlighting:

```typescript
export interface CodeBlock extends BlockNode {
  type: "CodeBlock";
  loc?: Location;
  language?: string;
  attributes?: Attributes;
  metadata?: Metadata;
  content: TextNode[];
}
```

**Syntax**:
````
``` language [attributes]
---
metadata
---
content
```
````

**Example**:
````blocks
``` python [#example .highlight ?linenos]
---
theme: monokai
---
def hello():
    print("world")
```
````

#### GenericBlock

Generic container blocks:

```typescript
export interface GenericBlock extends BlockNode {
  type: "GenericBlock";
  loc?: Location;
  name: string;
  delimiter: string;  // ":::", "::::", etc.
  attributes?: Attributes;
  metadata?: Metadata;
  content: (TextNode | ScriptNode | InlineNode | BlockNode | CommentNode)[];
}
```

**Syntax**:
```
::: name [attributes]
---
metadata
---
content
:::
```

**Example**:
```blocks
::: section [#main .container]
---
layout: grid
columns: 3
---
Content here
:::
```

---

## Position and Location

### Position

```typescript
export interface Position {
  path: string;    // Source file path
  line: number;    // Line number (1-indexed)
  column: number;  // Column number (1-indexed)
  offset: number;  // Absolute offset in file (0-indexed)
}
```

### Location

```typescript
export interface Location {
  start: Position;
  end: Position;
}
```

### Usage

Every node includes `loc?: Location` for:
- **Error reporting**: Show exact error position
- **Source maps**: Map generated code back to source
- **IDE features**: Go to definition, find references
- **Debugging**: Stack traces with source positions
- **Syntax highlighting**: Token positions

**Example error message**:
```
ParseError: Unclosed code block
  at document.blocks:10:1

   8 | Content before
   9 | 
  10 | ``` python
     | ^^^
  11 | def hello():
  12 |     print("world")
  13 | (EOF reached, expected ```)
```

---

## Delimiters

### Code Blocks

**Delimiter**: Always exactly 3 backticks `` ``` ``

**Rules**:
- Fixed length (no variation)
- No nesting of code blocks inside code blocks
- Content is always treated as text (no parsing)

**Syntax**:
````
``` language [attributes]
content
```
````

**Examples**:
````blocks
``` javascript
console.log("Hello");
```

``` python [.highlight]
print("Hello")
```
````

### Generic Blocks

**Delimiter**: Three or more colons `:::`, `::::`, `:::::`, etc.

**Rules**:
- Variable length (3+)
- **Nesting rule**: Child blocks MUST use strictly more colons than parent
- Opening and closing delimiters must match exactly

**Example**:
```blocks
::: section
Level 1 content

:::: subsection
Level 2 content

::::: note
Level 3 content
:::::

::::

:::
```

**Invalid nesting**:
```blocks
::: section
:::: subsection
:::   ❌ Wrong! Child has more colons, parent can't close with fewer
```

**Valid patterns**:
```blocks
::: outer
Content
:::

::::: outer
:::: inner
Content
::::
:::::

::: a
:::: b
::::: c
Content
:::::
::::
:::
```

---

## Inline Syntax

**Unified format**: `name:content[attributes]` or `` name`content`[attributes] ``

**Rules**:
- `name` is **required** (no anonymous inlines)
- Two separators: `:` (generic) or `` ` `` (code)
- Attributes are optional: `[...]`

### Examples

```blocks
// Code inline
code:`print("hello")`[.highlight ?copy @click=copyCode]

// Generic inlines
link:https://example.com[.external @click=track]
strong:important text[.urgent]
em:emphasized[.italic]
span:custom content[#id .class ?option key=value]

// Without attributes
link:https://example.com
code:`variable`
```

### Edge Cases

**Content with brackets**:
```blocks
code:arr[0][.highlight]
// Type: code, Content: "arr[0]", Attributes: [.highlight]
```

**Content with colons**:
```blocks
link:http://example.com[.url]
time:12:30:45[.formatted]
// First colon is separator, rest are content
```

**Nested quotes in attributes**:
```blocks
link:page[title="Link's title"]
link:page[title='Link "title"']
```

---

## Attributes

```typescript
export interface Attributes {
  id?: string;                        // #id
  classes: string[];                  // .class1 .class2
  options: string[];                  // ?option1 ?option2
  keyValues: Record<string, string>;  // key=value
  events: Record<string, string>;     // @event=handler
}
```

### Syntax

Format: `[#id .class1 .class2 ?option1 ?option2 key1=val1 key2=val2 @event=handler]`

**Types**:

1. **ID**: `#identifier`
   - Unique identifier
   - Only one per element
   - Example: `#main-header`

2. **Classes**: `.classname`
   - Multiple allowed
   - CSS class names
   - Example: `.container .flex .centered`

3. **Options**: `?option`
   - Boolean flags
   - Multiple allowed
   - Example: `?visible ?editable ?draggable`

4. **Key-Value**: `key=value`
   - Arbitrary attributes
   - Values can be quoted or unquoted
   - Example: `href="https://example.com" target="_blank"`

5. **Events**: `@event=handler`
   - HTML event bindings
   - Handler name or inline JavaScript
   - Example: `@click=handleClick @hover=onHover`

### Examples

```blocks
// Block with all attribute types
::: section [#hero .container .dark ?visible layout=grid @click=handleClick]
Content
:::

// Inline with attributes
link:Documentation[.external href="https://example.com" @click=trackClick]

// Code with attributes
``` python [#example .highlight ?linenos theme=monokai]
code here
```
```

### Attribute Parsing Rules

- Whitespace between attributes is optional but recommended
- Attribute order doesn't matter
- Values with spaces must be quoted
- Single or double quotes supported
- Escape quotes inside quoted values: `title="Link's \"title\""`

---

## Metadata

Metadata provides structured data for blocks using YAML syntax.

### Syntax

```blocks
::: blockName [attributes]
---
key: value
nested:
  prop1: value1
  prop2: value2
array:
  - item1
  - item2
---
Content
:::
```

### Metadata vs Attributes

**Attributes** (inline, CSS-like):
- Syntax: `[#id .class ?option]`
- Used for styling, IDs, CSS classes
- Ideal for: HTML rendering, JavaScript hooks, semantic markup

**Metadata** (YAML format):
- Syntax: YAML frontmatter between `---` delimiters
- Used for structured data (objects, arrays, primitives)
- Ideal for: Configuration, data binding, conditional rendering

### Document-Level Metadata

```blocks
---
title: My Document
author: John Doe
date: 2026-02-07
tags:
  - tutorial
  - blocks
config:
  theme: dark
  lang: en
---

Document content here
```

### Block-Level Metadata

```blocks
::: card [.featured]
---
priority: high
visibility: public
settings:
  collapsible: true
  expanded: false
---
Card content
:::
```

### TypeScript Interface

```typescript
export type Metadata = Record<string, any>;
```

Metadata can contain:
- Primitives: `string`, `number`, `boolean`, `null`
- Arrays: `string[]`, `number[]`, etc.
- Objects: Nested structures
- Mixed types: Any combination

---

## Variables and Filters

### Variable Types

#### 1. Simple Variables

**Syntax**: `{varname}`

**Example**:
```blocks
---
username: Alice
count: 42
---

Hello, {username}!
Count: {count}
```

#### 2. Interpolated Variables

**Syntax**: `${varname}`, `${obj.prop}`, `${expression}`

**Example**:
```blocks
---
base_url: https://api.example.com
api_version: v2
user_id: 12345
---

URL: ${base_url}/${api_version}/users/${user_id}
Result: https://api.example.com/v2/users/12345
```

**Features**:
- JavaScript-style string interpolation
- Property access: `${obj.property}`
- Array indexing: `${array[0]}`
- Expressions: `${price * 1.2}`

#### 3. Filtered Variables

**Syntax**: `{varname|filter}`, `{varname|filter:arg}`, `{varname|filter1|filter2}`

**Example**:
```blocks
---
price: 29.99
date: 2026-02-06
text: "HELLO WORLD"
---

Price: {price|currency:EUR}
Date: {date|date:DD/MM/YYYY}
Text: {text|lower|truncate:20}
```

### Filters

**Available Filters**:

| Filter | Arguments | Input Type | Output Type | Description |
|--------|-----------|------------|-------------|-------------|
| `upper` | None | string | string | Convert to uppercase |
| `lower` | None | string | string | Convert to lowercase |
| `capitalize` | None | string | string | Capitalize first letter |
| `truncate` | N (length) | string | string | Truncate to N characters, add "..." |
| `date` | FORMAT | string/date | string | Format date using format string |
| `currency` | CODE | number | string | Format as currency (USD, EUR, GBP, etc.) |
| `number` | DECIMALS | number | string | Format number with N decimal places |
| `json` | None | any | string | Convert to JSON string |
| `escape` | None | string | string | Escape HTML entities |

**Filter Chaining**:

Filters execute left-to-right:
```blocks
{text|lower|truncate:50}
// Execution: text → lower() → truncate(50)

{description|escape|truncate:100}
// Execution: description → escape() → truncate(100)
```

**Filter Examples**:

```blocks
// Text transformation
{text|upper}        // "HELLO WORLD"
{text|lower}        // "hello world"
{text|capitalize}   // "Hello world"

// Truncation
{description|truncate:50}
// "This is a very long description that needs to b..."

// Date formatting
{date|date:YYYY-MM-DD}      // "2026-02-06"
{date|date:DD/MM/YYYY}      // "06/02/2026"
{date|date:MMMM D, YYYY}    // "February 6, 2026"

// Currency
{price|currency:USD}  // "$29.99"
{price|currency:EUR}  // "€29.99"
{price|currency:GBP}  // "£29.99"

// Number formatting
{value|number:2}   // "3.14"
{value|number:0}   // "3"

// HTML escaping
{html|escape}
// "&lt;script&gt;alert('xss')&lt;/script&gt;"

// JSON conversion
{data|json}
// '{"key":"value","nested":{"prop":123}}'
```

---

## Scripts

Scripts allow embedding JavaScript expressions directly in content.

### Syntax

```blocks
${ javascript_expression }
```

### Examples

**Basic expressions**:
```blocks
Total: ${price * quantity} EUR
Current year: ${new Date().getFullYear()}
Random: ${Math.random() > 0.5 ? "heads" : "tails"}
```

**With metadata**:
```blocks
---
price: 29.99
quantity: 3
tax_rate: 0.2
---

Subtotal: ${price * quantity}
Tax: ${price * quantity * tax_rate}
Total: ${price * quantity * (1 + tax_rate)}
```

**Property access**:
```blocks
---
user:
  name: Alice
  age: 30
  email: alice@example.com
---

Name: ${user.name}
Email: ${user.email}
```

**Array operations**:
```blocks
---
items:
  - Apple
  - Banana
  - Orange
---

First: ${items[0]}
Count: ${items.length}
```

### Script Blocks

**Syntax**:
```blocks
!!! [name] [attributes]
---
metadata
---
javascript code
!!!
```

**Example**:
```blocks
!!! init [#startup]
const config = {
  theme: 'dark',
  lang: 'en'
};

console.log('Initialized:', config);
!!!
```

---

## Escape System

Universal escape sequences for all special characters.

### Escape Sequences

| Sequence | Result | Usage |
|----------|--------|-------|
| `\\` | `\` | Literal backslash |
| `\#` | `#` | Literal hash (not ID) |
| `\.` | `.` | Literal dot (not class) |
| `\?` | `?` | Literal question mark (not option) |
| `\{` | `{` | Literal brace (not variable) |
| `\}` | `}` | Literal brace |
| `\$` | `$` | Literal dollar sign (not script) |
| `\:` | `:` | Literal colon (not separator) |
| `\|` | `|` | Literal pipe (not filter) |
| `\[` | `[` | Literal bracket (not attributes) |
| `\]` | `]` | Literal bracket |
| `` \` `` | `` ` `` | Literal backtick |
| `\` (EOL) | (continue) | Line continuation |

### Line Continuation

Backslash at end of line continues to next line:

```blocks
This is a very long line that \
continues on the next line \
and the third line.

Result: "This is a very long line that continues on the next line and the third line."
```

### Examples

**Escaping special characters**:
```blocks
// Literal brackets
Price: \$29.99

// Literal colons
Time: 12\:30\:45

// Literal pipes
Command: ls \| grep test

// Literal braces
Template: \{variable\}
```

**In attributes**:
```blocks
link:example.com[title="Price: \$99"]
code:`arr\[0\]`[.highlight]
```

**In metadata**:
```blocks
---
description: "Use \{var\} for variables"
pattern: "file\\.txt"
---
```

---

## Comments

Comments allow annotations without affecting output.

### Block Comments

**Syntax**: `/* content */`

**Examples**:
```blocks
/* This is a simple comment */

/* This is a
   multi-line comment */

/* #include header.blocks */
/* #ifdef DEBUG */
```

**With name**:
```blocks
/* #name content */
```

If the first token after `/*` is `#identifier`, it becomes the comment name.

### Inline Comments

**Syntax**: `// content` (until end of line)

**Examples**:
```blocks
// This is a single-line comment

Some content // Comment at end of line

// #todo Fix this later
// #note Important detail
```

**With name**:
```blocks
// #name content
```

### Comment Nodes in AST

Comments are preserved in the AST for:
- Documentation generation
- Source analysis
- Preprocessing directives
- Code comments in output

---

## Examples

### Complete Document Example

```blocks
---
title: API Documentation
version: 2.0
base_url: https://api.example.com
api_version: v2
price: 29.99
release_date: 2026-02-06
author: John Doe
features:
  - Authentication
  - Rate limiting
  - Caching
---

/* Document header */

::: header [#main-header .sticky]
---
background: gradient
height: 80px
---

# strong:{title}[.brand] version {version}

Current year: ${new Date().getFullYear()}

:::

/* Main content */

::: section [#intro .hero @click=handleHeroClick]
---
layout: centered
padding: 40px
---

Welcome to the API!

Endpoint: code:`${base_url}/${api_version}`[.api-url ?copy]

:::: features [.grid]
---
columns: 3
gap: 20px
---

Feature list:
${features.map(f => `- ${f}`).join('\n')}

::::

:::

/* Pricing section */

::: section [#pricing]
---
visibility: public
---

Price: {price|currency:USD} or {price|currency:EUR}
Released: {release_date|date:MMMM D, YYYY}
Author: {author|capitalize}

link:${base_url}/docs[.external target="_blank" @click=trackClick] for more info.

:::

/* Code example */

``` python [#example .highlight ?linenos]
---
theme: monokai
editable: false
---
def hello():
    """Say hello to the world"""
    print("Hello, World!")
    
hello()
```

/* Footer */

::: footer [#main-footer]
---
copyright: 2026
---

© ${new Date().getFullYear()} - All rights reserved

:::
```

### Simple Examples

**Text with variables**:
```blocks
---
name: Alice
age: 30
---

Hello, {name}! You are {age} years old.
```

**Nested blocks**:
```blocks
::: container
Outer content

:::: inner
Inner content

::::: deepest
Deepest content
:::::

::::

:::
```

**Inlines with attributes**:
```blocks
Visit link:https://example.com[.external @click=track]

Execute code:`npm install`[.command ?copy]

Important: strong:Read this carefully[.urgent]
```

**Scripts and filters**:
```blocks
---
price: 29.99
discount: 0.15
---

Original: ${price}
Discount: ${price * discount}
Final: ${price * (1 - discount)}
Formatted: {price|currency:USD}
```

---

## Implementation Notes

### Parser Requirements

1. **Lexer**: Tokenize input into blocks, inlines, variables, etc.
2. **Parser**: Build AST from tokens using Chevrotain
3. **Validator**: Validate syntax and constraints
4. **Evaluator**: Process variables, filters, and scripts
5. **Renderer**: Generate output (HTML, Markdown, etc.)

### Location Tracking

Every node should include location information:
- Start position (line, column, offset)
- End position (line, column, offset)
- Source file path

This enables:
- Precise error messages
- Source maps
- IDE integration
- Debugging tools

### Error Handling

Errors should include:
- Error type/code
- Human-readable message
- Location information
- Suggested fixes (when possible)

**Example**:
```
ParseError: Unclosed generic block
  at document.blocks:15:1
  
  Hint: Add closing delimiter ':::' to match opening at line 10
```

### Performance Considerations

1. **Lazy evaluation**: Only evaluate scripts when needed
2. **Filter caching**: Cache filter results
3. **AST optimization**: Remove unused nodes
4. **Incremental parsing**: Re-parse only changed sections

---

## Appendix

### Related Documents

- [LANGUAGE.md](../LANGUAGE.md) - Language overview and file extension
- [syntax.md](./syntax.md) - Detailed syntax specification
- [PREPROCESSOR.md](./PREPROCESSOR.md) - Preprocessor documentation
- [examples.md](./examples.md) - Example code and use cases
- [README.md](../README.md) - Getting started guide

### TypeScript Definitions

Complete type definitions are available in:
- `src/parser/ast.ts` - AST node types
- `src/preprocessor/types.ts` - Preprocessor types

### Versioning

This specification follows semantic versioning:
- **Major version**: Breaking changes to syntax or semantics
- **Minor version**: New features, backward compatible
- **Patch version**: Bug fixes and clarifications

Current version: **1.0.0**

---

## License

MIT License - See LICENSE file for details

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Maintained By**: Blocks Language Team
