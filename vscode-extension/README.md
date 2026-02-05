# Blocks Language Support for Visual Studio Code

Adds syntax highlighting support for Blocks language (`.block` files).

## Features

- Syntax highlighting for all Blocks constructs
- Comment folding
- Auto-closing pairs
- Bracket matching

## Installation

1. Copy this folder to your VSCode extensions directory
2. Reload VSCode
3. Open any `.block` file

## Supported Syntax

- Block comments: `/* ... */`
- Inline comments: `// ... //`
- Code blocks: ` ``` ... ``` `
- Script blocks: `!!! ... !!!`
- Generic blocks: `::: ... :::`
- Inline code, script, generic
- Attributes: `{#id .class %option key=value}`
