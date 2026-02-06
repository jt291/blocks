# Blocks Syntax Specification

Complete, unified syntax reference for the Blocks markup language.

## Table of Contents

1. [Block-Level Syntax](#block-level-syntax)
2. [Inline Syntax](#inline-syntax)
3. [Variable Syntax](#variable-syntax)
4. [Metadata Syntax](#metadata-syntax)
5. [Attributes vs Metadata](#attributes-vs-metadata)
6. [Complete Examples](#complete-examples)
7. [AST Representation](#ast-representation)
8. [Edge Cases](#edge-cases)

---

## Block-Level Syntax

### Generic Blocks

**Syntax:**
```blocks
::: blockType #id .class1 .class2 %option1 %option2 key=value key2="quoted value"
Block content
:::
```

**Components:**
- `blockType` → Block type (no prefix, required)
- `#id` → Unique identifier (optional, prefix `#`)
- `.class` → CSS classes (optional, prefix `.`, multiple allowed)
- `%option` → Boolean flags (optional, prefix `%`, multiple allowed)
- `key=value` → Key-value pairs (optional, no prefix, values can be quoted)

**Examples:**

```blocks
::: note
Simple note without attributes
:::
```

```blocks
::: note #intro .important
Note with ID and class
:::
```

```blocks
::: warning #alert .urgent .dismissible %closable %sound level=critical timeout=5000
Warning with:
- ID: alert
- Classes: urgent, dismissible
- Options: closable, sound
- Attributes: level=critical, timeout=5000
:::
```

### Code Blocks (Backticks)

**Syntax:**
```blocks
``` language #id .class %option key=value
Code content
```
```

**Example:**
```blocks
``` python #example .highlight %linenos start=1 theme=monokai
def hello():
    print("Hello, World!")
```
```

### Code Blocks (Exclamation Marks)

**Syntax:**
```blocks
!!! language #id .class %option key=value
Code content
!!!
```

**Example:**
```blocks
!!! javascript #demo .interactive %editable mode=live
console.log("Interactive demo");
!!!
```

### Comment Blocks

**Syntax:**
```blocks
/* #name? content */
```

**Examples:**
```blocks
/* Simple comment */

/* #include header.blocks */

/* #ifdef DEBUG
Debug mode enabled
*/
```

### Metadata Blocks

**Syntax:**
```blocks
---
key: value
nested:
  property: value
array:
  - item1
  - item2
---
```

**Example:**
```blocks
---
title: My Document
author: John Doe
date: 2026-02-06
tags: [documentation, syntax]
config:
  theme: dark
  debug: true
---
```

---

## Inline Syntax

### Format

**Syntax:**
```blocks
inlineType:content[#id .class %option key=value]
```

**Components:**
- `inlineType` → Type of inline element (code, link, strong, em, span, etc.)
- `:` → Separator between type and content
- `content` → The inline content
- `[...]` → Optional attributes (same syntax as blocks)

### Examples

**Code inline:**
```blocks
Paragraph with code:print("hello")[.highlight %copy] inline code.
```

**Link inline:**
```blocks
A link:https://example.com[#link1 .external target="_blank"] in text.
```

**Emphasis inline:**
```blocks
Emphasis strong:important text[.urgent %blink color=red] to read.
```

**Custom span:**
```blocks
Custom span:custom content[#custom .special data-value="123"] element.
```

**Without attributes:**
```blocks
Simple code:variable without attributes.
```

**With title:**
```blocks
Link with title link:documentation[title="Read the docs" .internal].
```

### Edge Cases

**Code with brackets:**
```blocks
Code with brackets: code:arr[0][.highlight]
```

**Code with colons:**
```blocks
Code with colons: code:http://example.com[.url]
```

**Nested quotes:**
```blocks
Nested quotes: link:page["with quotes"][title="Link's title"]
```

---

## Variable Syntax

### Simple Variables

**Syntax:**
```blocks
{varname}
```

**Example:**
```blocks
Hello {username}!
```

### Interpolated Variables (JavaScript-like)

**Syntax:**
```blocks
${varname}
${object.property}
${array[0]}
```

**Examples:**
```blocks
Interpolated path: ${base_path}/images/${filename}.png
API endpoint: ${api_url}/users/${user_id}
Complex: ${config.theme}/styles/${variant}.css
```

### Filtered Variables

**Syntax:**
```blocks
{varname|filter}
{varname|filter:arg1}
{varname|filter:arg1:arg2}
```

**Examples:**
```blocks
Price: {price|currency:EUR}
Date: {today|date:YYYY-MM-DD}
Uppercase: {title|upper}
Lowercase: {text|lower}
Truncate: {description|truncate:100}
```

**Chained filters:**
```blocks
{text|lower|truncate:50}
```

### Common Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `upper` | Uppercase | `{text\|upper}` |
| `lower` | Lowercase | `{text\|lower}` |
| `capitalize` | Capitalize first letter | `{name\|capitalize}` |
| `truncate:N` | Truncate to N characters | `{text\|truncate:100}` |
| `date:FORMAT` | Format date | `{date\|date:YYYY-MM-DD}` |
| `currency:CODE` | Format as currency | `{price\|currency:EUR}` |
| `number:DECIMALS` | Format number | `{value\|number:2}` |
| `json` | Convert to JSON | `{data\|json}` |
| `escape` | Escape HTML | `{html\|escape}` |

---

## Metadata Syntax

### Global Metadata (Document Frontmatter)

**Syntax:**
```blocks
---
title: Document Title
author: John Doe
date: 2026-02-06
version: 1.0
config:
  theme: dark
  debug: true
variables:
  base_url: https://example.com
  api_endpoint: /api/v2
---

Document content starts here
```

### Local Metadata (Block-Level)

**Syntax:**
```blocks
::: blockType #id .class
---
key: value
nested:
  property: value
array:
  - item1
  - item2
---
Block content
:::
```

### Metadata Priority

**Rule:** Local metadata overrides global metadata

**Example:**
```blocks
---
theme: light
debug: false
base_url: https://example.com
---

::: section #main
---
theme: dark
debug: true
---
This section has theme=dark and debug=true (overrides global)
:::

::: section #secondary
This section inherits theme=light and debug=false (from global)
:::
```

---

## Attributes vs Metadata

### Attributes (Inline, Simple Values)

**Syntax:**
```blocks
::: note #intro .important level=high timeout=5000
```

- Inline with block delimiter
- Simple key=value pairs
- Used for: IDs, classes, options, simple configuration
- Syntax: `#id`, `.class`, `%option`, `key=value`

### Metadata (YAML, Structured Data)

**Syntax:**
```blocks
::: note #intro .important
---
level: high
timeout: 5000
recipients:
  - admin@example.com
  - ops@example.com
config:
  nested: value
  array: [1, 2, 3]
---
```

- Separate YAML block
- Complex structured data (objects, arrays, nested)
- Used for: Configuration, data binding, complex parameters
- Syntax: Standard YAML

### When to Use Which

| Use Case | Use Attributes | Use Metadata |
|----------|---------------|--------------|
| Styling (classes) | ✅ | ❌ |
| Identification (IDs) | ✅ | ❌ |
| Simple flags (options) | ✅ | ❌ |
| Simple key-value pairs | ✅ | ✅ |
| Nested data | ❌ | ✅ |
| Arrays | ❌ | ✅ |
| Objects | ❌ | ✅ |
| Data for scripts/formatters | ❌ | ✅ |

---

## Complete Examples

### Example 1: Documentation Page

```blocks
---
title: User Guide
version: 2.0
author: Documentation Team
base_url: https://example.com
api_endpoint: /api/v2
price: 29.99
install_date: 2026-02-06
min_version: 1.5
---

::: section #intro .hero %centered
---
background: gradient
color: white
padding: large
---

/* Welcome to {title} version {version} */

Guide written by strong:{author}[.author-name].

Visit our link:${base_url}/docs[.external target="_blank"] for more information.

:::

::: note #installation .step-1 %expandable
---
platform: linux
required: true
duration: 5
---

Install via package manager:

``` bash #install-cmd .copy-button %numbered
sudo apt-get update
sudo apt-get install blocks
```

Price: {price|currency:EUR}
Installation date: {install_date|date:DD/MM/YYYY}

API documentation: link:${base_url}${api_endpoint}/docs[.api-link #api-docs]

:::

::: warning #compatibility .important %closable level=high
---
min_version: 1.5
platforms: [linux, macos, windows]
---

Minimum required version: code:{min_version}[.version-number]

Test the API at: link:${base_url}${api_endpoint}/test[.api-link target="_blank"]

Status: span:operational[.status .status-ok data-status="ok"]

:::
```

### Example 2: Blog Post

```blocks
---
title: Getting Started with Blocks
author: Jane Smith
published: 2026-02-06
category: tutorial
tags: [beginner, syntax, guide]
---

::: article #main-content .blog-post
---
reading_time: 5
difficulty: beginner
---

# {title}

By strong:{author}[.author-link] on {published|date:DD MMMM YYYY}

::: section #introduction .intro
Learn the basics of code:Blocks[.language-name %highlight] markup language.
:::

::: section #syntax-basics
---
section_number: 1
importance: high
---

## Basic Syntax

Use triple colons for blocks:

``` blocks #example1 .syntax-demo
::: note
This is a note block
:::
```

:::

:::
```

### Example 3: API Documentation

```blocks
---
api_version: v2
base_url: https://api.example.com
auth_required: true
rate_limit: 1000
---

::: endpoint #get-users .http-method %authenticated method=GET path=/users
---
description: Retrieve list of users
auth: bearer
response_format: json
rate_limit: 100
---

## GET link:${base_url}/users[.api-url]

### Authentication
Authentication: code:Bearer {token}[.header %required]

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code:page[.param] | integer | Page number |
| code:limit[.param] | integer | Items per page |

### Response

``` json #response-example .api-response
{
  "users": [
    {"id": 1, "name": "John"},
    {"id": 2, "name": "Jane"}
  ],
  "total": 2,
  "page": 1
}
```

### Rate Limit
strong:{rate_limit} requests per hour[.rate-limit %info]

:::
```

---

## AST Representation

### Block with All Features

**Input:**
```blocks
::: warning #compatibility .important %closable level=high
---
min_version: 1.5
platforms: [linux, macos, windows]
---
Content here
:::
```

**AST:**
```json
{
  "type": "generic-block",
  "blockType": "warning",
  "id": "compatibility",
  "classes": ["important"],
  "options": ["closable"],
  "attributes": {
    "level": "high"
  },
  "metadata": {
    "min_version": "1.5",
    "platforms": ["linux", "macos", "windows"]
  },
  "content": [
    {
      "type": "paragraph",
      "children": [
        { "type": "text", "content": "Content here" }
      ]
    }
  ]
}
```

### Variable Node

**Simple variable:**
```json
{
  "type": "variable",
  "name": "price",
  "filter": null
}
```

**Filtered variable:**
```json
{
  "type": "variable",
  "name": "price",
  "filter": "currency",
  "filterArgs": ["EUR"]
}
```

**Interpolated variable:**
```json
{
  "type": "variable",
  "name": "base_url",
  "interpolated": true
}
```

### Inline Element

**Input:**
```blocks
code:print("hello")[.highlight %copy]
```

**AST:**
```json
{
  "type": "inline",
  "inlineType": "code",
  "content": "print(\"hello\")",
  "classes": ["highlight"],
  "options": ["copy"],
  "attributes": {}
}
```

---

## Edge Cases

### Content with Special Characters

**Colons in content:**
```blocks
code:http://example.com[.url]
code:C:\Users\path[.windows-path]
```

**Brackets in content:**
```blocks
code:arr[0][.highlight]
code:dict["key"][.code]
```

**Nested quotes:**
```blocks
link:page["with quotes"][title="Link's title"]
span:text with 'quotes'[data-value="123"]
```

### Escaping

**Escape special characters:**
```blocks
Use \: to escape colons
Use \[ to escape brackets
Use \{ to escape braces
Use \` to escape backticks
```

**Example:**
```blocks
Text with escaped code\:print("hello") inline.
Variable syntax: \{varname\} without parsing.
```

### Empty Attributes

**With empty attributes:**
```blocks
type:content[]
```

**Without attributes:**
```blocks
type:content
```

### Whitespace Handling

**Leading/trailing spaces:**
```blocks
::: note
  Content with leading spaces
  Preserved in output
:::
```

**Inline spacing:**
```blocks
Text before code:variable text after.
Text before code:variable[.class] text after.
```

---

## Parser Implementation Notes

### Requirements

1. Parse block attributes: `#id`, `.class`, `%option`, `key=value`
2. Parse inline syntax: `type:content[attributes]`
3. Parse variables: `{var}`, `${var}`, `{var|filter:arg}`
4. Parse metadata: YAML blocks within blocks
5. Handle escaping: `\:`, `\[`, `\{`, etc.

### Tokenization

**Block delimiters:**
- `:::` → Generic block
- ` ``` ` → Code block (backticks)
- `!!!` → Code block (exclamation marks)
- `/*` → Comment block
- `---` → Metadata block

**Inline delimiters:**
- `:` → Generic inline
- `` ` `` → Code inline
- `!` → Script inline
- `//` → Comment inline

**Attribute markers:**
- `#` → ID
- `.` → Class
- `%` → Option
- `key=value` → Key-value pair

**Variable markers:**
- `{` → Simple variable
- `${` → Interpolated variable
- `|` → Filter separator

### Parsing Order

1. **Tokenization**: Break input into tokens
2. **Block parsing**: Identify and parse block structures
3. **Inline parsing**: Parse inline elements within blocks
4. **Variable parsing**: Parse variables within text
5. **Attribute parsing**: Parse attributes for blocks and inlines
6. **Metadata parsing**: Parse YAML metadata blocks
7. **AST construction**: Build abstract syntax tree

### Error Handling

**Common errors:**
- Unclosed blocks
- Unclosed inlines
- Invalid attribute syntax
- Invalid metadata YAML
- Circular includes
- Missing files

**Error recovery:**
- Report error with line/column
- Continue parsing when possible
- Provide helpful error messages

---

## Best Practices

### Block Usage

✅ **DO:**
- Use generic blocks for semantic content
- Use code blocks for code examples
- Add IDs for important blocks
- Add classes for styling
- Use options for boolean flags

❌ **DON'T:**
- Nest blocks unnecessarily
- Use overly long attribute lists
- Mix concerns (content + styling)

### Inline Usage

✅ **DO:**
- Use inline elements for short content
- Add attributes sparingly
- Use semantic types (code, link, strong)

❌ **DON'T:**
- Use inline for long content
- Overuse attributes
- Create deeply nested inlines

### Variable Usage

✅ **DO:**
- Use simple variables for single values
- Use interpolated variables for paths/URLs
- Use filters for formatting
- Define variables in metadata

❌ **DON'T:**
- Overuse variables
- Use undefined variables
- Chain too many filters

### Metadata Usage

✅ **DO:**
- Use global metadata for document-wide settings
- Use local metadata for block-specific data
- Structure data logically
- Use YAML conventions

❌ **DON'T:**
- Duplicate data
- Use complex nested structures unnecessarily
- Mix metadata with content

---

## See Also

- [Language Specification (LANGUAGE.md)](../LANGUAGE.md) - Formal language specification
- [Examples (examples.md)](./examples.md) - Comprehensive examples
- [Preprocessor Documentation (PREPROCESSOR.md)](./PREPROCESSOR.md) - Preprocessor features
- [Cheatsheet](../cheatsheet.html) - Quick reference
- [Interactive Playground](../public/playground.html) - Try it live
