# Blocks Language Syntax Specification

## Overview

This document provides the complete technical specification for the Blocks language syntax, including formal grammar, inline elements, variables, filters, and AST representations.

## Table of Contents

1. [Inline Elements](#inline-elements)
2. [Variables](#variables)
3. [Filters](#filters)
4. [AST Representations](#ast-representations)
5. [Parsing Rules](#parsing-rules)
6. [Edge Cases](#edge-cases)

---

## Inline Elements

### Formal Grammar

```ebnf
inline           ::= inlineType ':' content ('[' attributes ']')?
inlineType       ::= identifier
content          ::= text  (* excluding unescaped '[' *)
attributes       ::= attribute-list  (* same as block attributes *)

attribute-list   ::= attribute*
attribute        ::= id | class | option | key-value
id               ::= '#' identifier
class            ::= '.' identifier
option           ::= '%' identifier
key-value        ::= identifier '=' value
value            ::= quoted-string | unquoted-string
identifier       ::= [a-zA-Z_][a-zA-Z0-9_-]*
```

### Syntax Rules

1. **Type name**: Alphanumeric identifier (no `#` prefix)
2. **Separator**: Single colon `:`
3. **Content**: Any text until `[` or end of inline
4. **Attributes**: Optional, enclosed in `[...]`
5. **Attribute syntax**: Same as blocks (`#id`, `.class`, `%option`, `key=value`)

### Common Inline Types

- `code` – Inline code
- `link` – Hyperlink
- `strong` – Strong emphasis (bold)
- `em` – Emphasis (italic)
- `span` – Generic inline container

### Examples

#### Basic inline without attributes

```blocks
code:print("hello")
link:https://example.com
strong:important text
```

#### Inline with attributes

```blocks
code:print("hello")[.highlight %copy]
link:documentation[.external target="_blank"]
strong:critical[.urgent color=red]
span:status[#status1 .active data-status="ok"]
```

#### Edge cases

**Content with brackets:**
```blocks
code:arr[0][.highlight]
```
- Type: `code`
- Content: `arr[0]`
- Attributes: `[.highlight]`

**Content with colons:**
```blocks
code:http://example.com[.url]
code:12:30:45[.time]
```
- First colon after type is separator
- All subsequent colons are part of content

**Nested quotes in attributes:**
```blocks
link:page[title="Link's title"]
span:text[data-json='{"key": "value"}']
```

### AST Representation

```json
{
  "type": "inline",
  "inlineType": "code",
  "content": "print(\"hello\")",
  "id": null,
  "classes": ["highlight"],
  "options": ["copy"],
  "attributes": {}
}
```

```json
{
  "type": "inline",
  "inlineType": "link",
  "content": "documentation",
  "id": null,
  "classes": ["external"],
  "options": [],
  "attributes": {
    "target": "_blank"
  }
}
```

---

## Variables

### Formal Grammar

```ebnf
variable             ::= simple-var | interpolated-var | filtered-var

simple-var           ::= '{' identifier '}'
interpolated-var     ::= '${' expression '}'
filtered-var         ::= '{' identifier filter-chain '}'

filter-chain         ::= ('|' filter)+
filter               ::= filter-name (':' filter-arg)*
filter-name          ::= identifier
filter-arg           ::= identifier | number | string

expression           ::= identifier ('.' identifier | '[' index ']')*
identifier           ::= [a-zA-Z_][a-zA-Z0-9_]*
index                ::= number
```

### Variable Types

#### 1. Simple Variables

**Syntax:** `{varname}`

**Usage:**
```blocks
---
username: Alice
count: 42
---

Hello, {username}!
Count: {count}
```

**AST:**
```json
{
  "type": "variable",
  "name": "username",
  "interpolated": false,
  "filters": []
}
```

#### 2. Interpolated Variables

**Syntax:** `${varname}`, `${obj.prop}`, `${arr[0]}`

**Usage:**
```blocks
---
base_url: https://api.example.com
api_version: v2
user_id: 12345
---

URL: ${base_url}/${api_version}/users/${user_id}
Result: https://api.example.com/v2/users/12345
```

**Features:**
- JavaScript-style string interpolation
- Property access: `${obj.property}`
- Array indexing: `${array[0]}`
- Path construction

**AST:**
```json
{
  "type": "variable",
  "name": "base_url",
  "interpolated": true,
  "filters": []
}
```

#### 3. Filtered Variables

**Syntax:** `{varname|filter}`, `{varname|filter:arg}`, `{varname|filter1|filter2}`

**Usage:**
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

**AST:**
```json
{
  "type": "variable",
  "name": "price",
  "interpolated": false,
  "filters": [
    {
      "name": "currency",
      "args": ["EUR"]
    }
  ]
}
```

**Chained filters AST:**
```json
{
  "type": "variable",
  "name": "text",
  "interpolated": false,
  "filters": [
    {
      "name": "lower",
      "args": []
    },
    {
      "name": "truncate",
      "args": ["20"]
    }
  ]
}
```

---

## Filters

### Formal Specification

```ebnf
filter-spec      ::= filter-name (':' filter-args)?
filter-name      ::= [a-zA-Z_][a-zA-Z0-9_]*
filter-args      ::= arg (':' arg)*
arg              ::= number | string | identifier
```

### Available Filters

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

### Filter Examples

#### Text Transformation

```blocks
{text|upper}        // "HELLO WORLD"
{text|lower}        // "hello world"
{text|capitalize}   // "Hello world"
```

#### Truncation

```blocks
{description|truncate:50}
// Input:  "This is a very long description that needs to be truncated"
// Output: "This is a very long description that needs to b..."
```

#### Date Formatting

```blocks
{date|date:YYYY-MM-DD}      // "2026-02-06"
{date|date:DD/MM/YYYY}      // "06/02/2026"
{date|date:MMMM D, YYYY}    // "February 6, 2026"
```

**Format tokens:**
- `YYYY` – 4-digit year
- `MM` – 2-digit month
- `DD` – 2-digit day
- `MMMM` – Full month name
- `MMM` – Short month name
- `D` – Day without leading zero

#### Currency Formatting

```blocks
{price|currency:USD}  // "$29.99"
{price|currency:EUR}  // "€29.99"
{price|currency:GBP}  // "£29.99"
{price|currency:JPY}  // "¥29"
```

#### Number Formatting

```blocks
{value|number:2}   // "3.14"
{value|number:0}   // "3"
{value|number:4}   // "3.1416"
```

#### HTML Escaping

```blocks
{html|escape}
// Input:  "<script>alert('xss')</script>"
// Output: "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

#### JSON Conversion

```blocks
{data|json}
// Input:  {key: "value", nested: {prop: 123}}
// Output: '{"key":"value","nested":{"prop":123}}'
```

### Filter Chaining

Filters can be chained using the pipe `|` operator. Filters execute left-to-right, with each filter receiving the output of the previous filter.

```blocks
{text|lower|truncate:50}
// Execution: text → lower() → truncate(50)

{description|escape|truncate:100}
// Execution: description → escape() → truncate(100)

{price|number:2|currency:EUR}
// Execution: price → number(2) → currency("EUR")
```

**Important:** Filter order matters!

```blocks
{text|truncate:50|lower}  // Truncate first, then lowercase
{text|lower|truncate:50}  // Lowercase first, then truncate (recommended)
```

---

## AST Representations

### Inline Element

```json
{
  "type": "inline",
  "inlineType": "code",
  "content": "print(\"hello\")",
  "id": "example-id",
  "classes": ["highlight", "python"],
  "options": ["copy", "executable"],
  "attributes": {
    "data-lang": "python",
    "data-theme": "dark"
  }
}
```

### Simple Variable

```json
{
  "type": "variable",
  "name": "username",
  "interpolated": false,
  "filters": []
}
```

### Interpolated Variable

```json
{
  "type": "variable",
  "name": "base_url",
  "path": ["base_url"],
  "interpolated": true,
  "filters": []
}
```

### Interpolated Variable with Property Access

```json
{
  "type": "variable",
  "name": "config",
  "path": ["config", "theme", "color"],
  "expression": "config.theme.color",
  "interpolated": true,
  "filters": []
}
```

### Filtered Variable

```json
{
  "type": "variable",
  "name": "price",
  "interpolated": false,
  "filters": [
    {
      "name": "currency",
      "args": ["EUR"]
    }
  ]
}
```

### Chained Filters Variable

```json
{
  "type": "variable",
  "name": "description",
  "interpolated": false,
  "filters": [
    {
      "name": "escape",
      "args": []
    },
    {
      "name": "truncate",
      "args": ["100"]
    }
  ]
}
```

---

## Parsing Rules

### Inline Element Parsing

1. **Detect start**: Look for `type:` pattern
2. **Extract type**: Capture identifier before colon
3. **Extract content**: Capture text until `[` or end
4. **Parse attributes**: If `[` found, parse until `]`
5. **Validate**: Ensure type is valid identifier

**Example parsing:**
```
Input: code:print("hello")[.highlight %copy]

Step 1: Detect "code:"
Step 2: Type = "code"
Step 3: Content = 'print("hello")'
Step 4: Attributes = "[.highlight %copy]"
Step 5: Parse attributes → classes=["highlight"], options=["copy"]
```

### Variable Parsing

1. **Detect start**: `{` or `${`
2. **Determine type**:
   - `${` → Interpolated
   - `{` → Simple or Filtered
3. **Extract name**: Capture identifier
4. **Check for filters**: If `|` found, parse filter chain
5. **Parse filter chain**: Split by `|`, parse each filter
6. **Validate**: Ensure valid identifiers and arguments

**Example parsing:**
```
Input: {price|currency:EUR|number:2}

Step 1: Detect "{"
Step 2: Type = Filtered (contains "|")
Step 3: Name = "price"
Step 4: Filters found
Step 5: Parse chain → ["currency:EUR", "number:2"]
Step 6: Validate → Valid
```

### Filter Chain Parsing

1. **Split by pipe**: `text|filter1|filter2:arg`
2. **Parse each filter**:
   - Extract filter name
   - Split by colon for arguments
   - Validate filter name and arguments
3. **Build filter list**

---

## Edge Cases

### Inline Elements

#### Content with special characters

```blocks
code:arr[0][.highlight]
```
- Parser must distinguish content brackets from attribute brackets
- Solution: First `[` after content starts attributes

```blocks
code:function(arg1, arg2)[.highlight]
```
- Parentheses in content are allowed

#### Nested quotes in attributes

```blocks
link:text[title="Link's title"]
link:text[title='Link "title"']
```
- Use appropriate quote escaping

#### Empty attributes

```blocks
code:text[]      // Valid: empty attributes
code:text        // Valid: no attributes
```

### Variables

#### Variable name validation

```blocks
{valid_name}     // Valid: alphanumeric + underscore
{123invalid}     // Invalid: starts with number
{kebab-case}     // Invalid: contains hyphen (use snake_case)
```

#### Missing filter arguments

```blocks
{text|truncate}      // Should error or use default (50)
{text|truncate:}     // Should error: missing argument
{text|truncate:abc}  // Should error: invalid argument type
```

#### Undefined variables

```blocks
{undefined_var}      // Should return empty string or error
```

#### Filter errors

```blocks
{text|invalid_filter}           // Error: unknown filter
{number|truncate:50}            // Error: incompatible type
{price|currency:INVALID}        // Error: invalid currency code
```

### Filter Chaining

#### Incompatible filter sequences

```blocks
{text|number:2}              // Error: text is not a number
{number|truncate:50}         // Error: number is not a string
```

**Solution:** Ensure filter compatibility or add type coercion

```blocks
{number|json|truncate:50}    // OK: number → json (string) → truncate
```

---

## Complete Example

```blocks
---
title: API Documentation
version: 2.0
base_url: https://api.example.com
api_version: v2
price: 29.99
release_date: 2026-02-06
author: John Doe
---

::: section #intro .hero
---
background: gradient
---

/* Welcome to strong:{title}[.brand] version {version}! */

API endpoint: code:${base_url}/${api_version}[.api-url]

Price: {price|currency:USD} or {price|currency:EUR}
Released: {release_date|date:MMMM D, YYYY}
Author: {author|capitalize}

Visit link:${base_url}/docs[.external target="_blank"] for more info.

:::
```

**AST breakdown:**

- **Global metadata**: title, version, base_url, api_version, price, release_date, author
- **Block**: Generic block with ID, class, and local metadata
- **Inline elements**: 
  - `strong:{title}[.brand]` – Emphasis with variable and class
  - `code:${base_url}/${api_version}[.api-url]` – Code with interpolation
  - `link:${base_url}/docs[.external target="_blank"]` – Link with attributes
- **Variables**:
  - Simple: `{title}`, `{version}`
  - Interpolated: `${base_url}`, `${api_version}`
  - Filtered: `{price|currency:USD}`, `{release_date|date:MMMM D, YYYY}`, `{author|capitalize}`

---

## Implementation Notes

### Parser Requirements

1. **Lexer**: Tokenize input into inline elements, variables, blocks, etc.
2. **Parser**: Build AST from tokens
3. **Validator**: Validate syntax and constraints
4. **Evaluator**: Process variables and filters
5. **Renderer**: Generate output (HTML, Markdown, etc.)

### Escaping

**Escape sequences:**
- `\:` – Literal colon
- `\[` – Literal opening bracket
- `\{` – Literal opening brace
- `\$` – Literal dollar sign
- `\|` – Literal pipe

**Example:**
```blocks
code:key\:value[.highlight]     // Content: "key:value"
{text\|value}                   // Variable: "text|value"
```

### Performance Considerations

1. **Variable caching**: Cache resolved variable values
2. **Filter optimization**: Memoize filter results for repeated use
3. **Lazy evaluation**: Only evaluate variables when needed
4. **Incremental parsing**: Re-parse only changed sections

---

## Future Extensions

### Proposed Features

1. **Custom filter registration**: Allow users to define custom filters
2. **Filter namespaces**: `{text|string:truncate:50}`
3. **Conditional variables**: `{var|default:"N/A"}`
4. **Variable expressions**: `{price * 1.2|currency:EUR}`
5. **Inline templates**: `{template:user-card(user)}`

---

## References

- [LANGUAGE.md](../LANGUAGE.md) – Complete language specification
- [README.md](../README.md) – Getting started guide
- [Cheatsheet](../cheatsheet.html) – Quick reference
- [Examples](./examples.md) – Real-world examples
