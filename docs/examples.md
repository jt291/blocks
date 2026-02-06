# Blocks Language Examples

This document provides real-world examples demonstrating the Blocks language in various contexts.

## Table of Contents

1. [API Documentation](#api-documentation)
2. [Tutorial/Guide](#tutorialguide)
3. [Blog Post](#blog-post)
4. [Technical Specification](#technical-specification)
5. [Project README](#project-readme)

---

## API Documentation

Complete API documentation example showcasing endpoints, authentication, and code examples.

```blocks
---
title: REST API Documentation
version: 2.1
base_url: https://api.example.com
api_version: v2
last_updated: 2026-02-06
---

::: section #overview .hero
---
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
color: white
---

/* strong:{title}[.brand] version {version} */

Base URL: code:${base_url}/${api_version}[.api-url %copy]

Last updated: {last_updated|date:MMMM D, YYYY}

:::

::: section #authentication .important
---
required: true
---

## Authentication

All API requests require authentication using link:Bearer tokens[.doc-link target="_blank"].

### Request Header

```http #auth-header .copy-button
Authorization: Bearer YOUR_API_TOKEN
```

### Example Request

```bash #curl-example
curl -H "Authorization: Bearer ${API_TOKEN}" \
     ${base_url}/${api_version}/users
```

:::

::: section #endpoints

## Endpoints

### GET /users

Retrieve all users.

**Response:**

```json #response-users
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "total": 2
}
```

### POST /users

Create a new user.

**Request Body:**

```json #request-create-user
{
  "name": "Charlie",
  "email": "charlie@example.com"
}
```

**Response:**

```json #response-create-user
{
  "id": 3,
  "name": "Charlie",
  "email": "charlie@example.com",
  "created_at": "2026-02-06T10:30:00Z"
}
```

:::

::: note #rate-limiting .warning
---
severity: medium
type: info
---

### Rate Limiting

API is limited to strong:1000 requests per hour[.limit] per token.

Exceeding this limit returns code:429 Too Many Requests[.http-status].

:::

::: section #sdks

## SDKs

Official SDKs available for:

- link:${base_url}/sdks/javascript[.sdk-link] – JavaScript/TypeScript
- link:${base_url}/sdks/python[.sdk-link] – Python
- link:${base_url}/sdks/ruby[.sdk-link] – Ruby

:::

::: footer #api-footer
---
contact: support@example.com
---

Questions? Contact us at link:${contact}[.email-link]

:::
```

---

## Tutorial/Guide

Step-by-step tutorial with code examples and explanations.

```blocks
---
title: Getting Started with Blocks
author: Tutorial Team
difficulty: beginner
duration: 15
duration_unit: minutes
updated: 2026-02-06
---

::: section #intro .tutorial-header
---
step: 0
---

/* strong:{title}[.tutorial-title] */

By: {author|capitalize} • Difficulty: span:{difficulty}[.badge .badge-{difficulty}]
Duration: {duration} {duration_unit}

Last updated: {last_updated|date:DD/MM/YYYY}

:::

::: section #step-1 .tutorial-step
---
step: 1
---

## Step 1: Installation

Install Blocks using your package manager:

```bash #install-command .copy-button
npm install blocks
```

Or with Yarn:

```bash #install-yarn
yarn add blocks
```

Verify installation:

```bash #verify
npx blocks --version
```

Expected output: code:blocks v2.0.0[.version]

:::

::: section #step-2 .tutorial-step
---
step: 2
---

## Step 2: Create Your First Document

Create a file named code:hello.block[.filename]:

```blocks #first-doc
---
title: Hello World
---

/* This is my first Blocks document */

Welcome to strong:Blocks[.brand]!

This is a simple paragraph.
```

Save this file and proceed to the next step.

:::

::: section #step-3 .tutorial-step
---
step: 3
---

## Step 3: Parse the Document

Create a parser script code:parse.js[.filename]:

```javascript #parser-script
import { parse } from 'blocks';
import fs from 'fs';

const content = fs.readFileSync('hello.block', 'utf-8');
const result = parse(content);

console.log(JSON.stringify(result.ast, null, 2));
```

Run the script:

```bash #run-parser
node parse.js
```

:::

::: note #tip .success
---
type: tip
---

/* 💡 Pro Tip */

Use code:--watch[.flag] mode to automatically re-parse on file changes:

```bash
npx blocks --watch hello.block
```

:::

::: section #step-4 .tutorial-step
---
step: 4
---

## Step 4: Using Variables

Add variables to your document:

```blocks #variables-example
---
username: Alice
greeting: Hello
---

{greeting}, strong:{username}[.user-name]!

Welcome to the tutorial.
```

Variables are substituted at render time.

:::

::: section #step-5 .tutorial-step
---
step: 5
---

## Step 5: Adding Inline Elements

Enhance your document with inline elements:

```blocks #inline-example
Visit our link:https://docs.blocks.io[.doc-link target="_blank"] for more information.

Use code:npm install[.command] to install packages.

Status: span:operational[.status .status-ok data-status="ok"]
```

:::

::: section #next-steps .tutorial-footer
---
next_tutorial: advanced-blocks
---

## Next Steps

Congratulations! You've completed the basics.

Continue learning:
- link:advanced-blocks[.tutorial-link] – Advanced features
- link:best-practices[.tutorial-link] – Best practices
- link:examples[.tutorial-link] – More examples

:::
```

---

## Blog Post

Blog post with metadata, images, and social sharing.

```blocks
---
title: Building Modern Documentation with Blocks
author: Jane Smith
published: 2026-02-06
updated: 2026-02-06
category: Documentation
tags: [blocks, documentation, markdown, tutorial]
reading_time: 8
excerpt: "Learn how to create beautiful, maintainable documentation using the Blocks language."
featured_image: /images/blocks-hero.png
---

::: article #main-article
---
layout: article
sidebar: true
---

/* strong:{title}[.article-title] */

By link:{author}[.author-link] • Published {published|date:MMMM D, YYYY}
Reading time: {reading_time} minutes

Category: span:{category}[.category-badge]

:::

::: section #introduction

## Introduction

Documentation is the backbone of any successful project. Yet, creating and maintaining documentation that is both strong:beautiful[.emphasis] and strong:functional[.emphasis] remains a challenge.

Enter em:Blocks[.brand] – a modern markup language designed specifically for documentation.

:::

::: section #why-blocks

## Why Blocks?

Traditional documentation formats have limitations:

1. strong:Markdown[.format] – Simple but limited
2. strong:HTML[.format] – Powerful but verbose
3. strong:reStructuredText[.format] – Complex syntax

Blocks combines the best of all worlds:

- ✅ Simple, readable syntax
- ✅ Powerful features (variables, filters, metadata)
- ✅ Extensible architecture
- ✅ First-class attribute support

:::

::: code-example #demo .highlighted
---
language: blocks
theme: dracula
---

```blocks
---
title: API Reference
version: 2.0
---

::: section #overview
/* Welcome to {title} version {version} */

Visit link:https://api.docs[.external] for details.
:::
```

:::

::: note #key-features .info
---
icon: 🌟
---

### Key Features

- Variables: code:{price|currency:EUR}[.inline-code]
- Inline elements: code:link:url[.external][.inline-code]
- Metadata: YAML frontmatter
- Attributes: CSS-like selectors

:::

::: section #getting-started

## Getting Started

Installation is simple:

```bash #install
npm install blocks
```

Create your first document:

```blocks #first-doc
---
title: My First Doc
---

/* Hello, strong:World[.greeting]! */

This is my first Blocks document.
```

:::

::: section #advanced-features

## Advanced Features

### Variables and Filters

Use variables with filters for dynamic content:

```blocks
---
price: 29.99
date: 2026-02-06
---

Price: {price|currency:EUR}
Date: {date|date:MMMM D, YYYY}
```

### Inline Elements

Add attributes to inline elements:

```blocks
Visit link:docs[.external target="_blank"] for more.

Use code:npm install[.command %copy] to install.
```

:::

::: quote #testimonial .featured
---
author: John Doe
role: Lead Developer
company: Tech Corp
---

"Blocks transformed how we write documentation. The syntax is intuitive, and the features are powerful. Highly recommended!"

– em:{author}[.quote-author], {role} at {company}

:::

::: section #conclusion

## Conclusion

Blocks represents a new generation of documentation tools. Whether you're writing API docs, tutorials, or blog posts, Blocks provides the flexibility and power you need.

Try it today: link:https://blocks.io[.cta-link target="_blank"]

:::

::: footer #article-footer
---
social_share: true
---

Found this helpful? Share it:
- link:twitter[.social .twitter data-share="twitter"]
- link:linkedin[.social .linkedin data-share="linkedin"]
- link:facebook[.social .facebook data-share="facebook"]

:::
```

---

## Technical Specification

Formal specification document for a software component.

```blocks
---
title: WebSocket Protocol Specification
version: 1.0.0
status: Draft
authors:
  - Alice Johnson
  - Bob Smith
published: 2026-02-06
last_updated: 2026-02-06
---

::: section #header .spec-header
---
type: specification
standard: RFC-BLOCKS-001
---

/* strong:{title}[.spec-title] */

Version: code:{version}[.version-badge]
Status: span:{status}[.status .status-{status|lower}]

Authors: {authors|json}
Published: {published|date:YYYY-MM-DD}

:::

::: section #abstract .spec-section
---
section: 1
---

## 1. Abstract

This document specifies the WebSocket protocol for real-time bidirectional communication between client and server.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in strong:RFC 2119[.rfc-ref].

:::

::: section #introduction .spec-section
---
section: 2
---

## 2. Introduction

### 2.1 Purpose

The purpose of this specification is to define a standard protocol for WebSocket communication.

### 2.2 Scope

This specification covers:
- Connection establishment
- Message framing
- Data transfer
- Connection termination

:::

::: section #protocol .spec-section
---
section: 3
---

## 3. Protocol Specification

### 3.1 Connection Handshake

The client strong:MUST[.rfc-keyword] initiate the handshake by sending an HTTP upgrade request:

```http #handshake-request
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

The server strong:MUST[.rfc-keyword] respond with:

```http #handshake-response
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### 3.2 Message Format

Messages strong:MUST[.rfc-keyword] be framed according to the following structure:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
```

:::

::: note #implementation-note .warning
---
type: implementation
---

/* ⚠️ Implementation Note */

Implementations strong:SHOULD[.rfc-keyword] validate all frame headers before processing payload data to prevent security vulnerabilities.

:::

::: section #opcodes .spec-section
---
section: 4
---

## 4. Opcodes

| Opcode | Meaning | Description |
|--------|---------|-------------|
| code:0x0[.opcode] | Continuation | Continuation frame |
| code:0x1[.opcode] | Text | Text message |
| code:0x2[.opcode] | Binary | Binary message |
| code:0x8[.opcode] | Close | Connection close |
| code:0x9[.opcode] | Ping | Ping frame |
| code:0xA[.opcode] | Pong | Pong frame |

:::

::: section #security .spec-section
---
section: 5
---

## 5. Security Considerations

### 5.1 Origin Validation

Servers strong:MUST[.rfc-keyword] validate the code:Origin[.header] header to prevent cross-site WebSocket hijacking attacks.

### 5.2 Masking

Client-to-server messages strong:MUST[.rfc-keyword] be masked. Server-to-client messages strong:MUST NOT[.rfc-keyword] be masked.

:::

::: section #references .spec-section
---
section: 6
---

## 6. References

### 6.1 Normative References

- link:RFC 2119[.rfc-link] – Key words for use in RFCs
- link:RFC 6455[.rfc-link] – The WebSocket Protocol

### 6.2 Informative References

- link:MDN WebSocket API[.external-link target="_blank"]

:::

::: footer #spec-footer
---
copyright: true
---

Copyright © 2026. All rights reserved.

Status: span:{status}[.status]
Version: {version}
Updated: {last_updated|date:MMMM D, YYYY}

:::
```

---

## Project README

Project README with installation, usage, and examples.

```blocks
---
title: Awesome Project
version: 3.2.1
license: MIT
repository: https://github.com/user/awesome-project
npm_package: awesome-project
stars: 1234
downloads: 50000
last_release: 2026-02-06
---

::: header #readme-header .hero
---
align: center
---

/* strong:{title}[.project-title] */

Version: code:{version}[.version-badge]
License: span:{license}[.license-badge]

span:⭐ {stars} stars[.stats] • span:📦 {downloads} downloads[.stats]

link:Documentation[.btn .btn-primary] • link:Examples[.btn .btn-secondary] • link:GitHub[.btn .btn-dark]

:::

::: section #features

## ✨ Features

- 🚀 **Fast** – Blazing fast performance
- 🎨 **Beautiful** – Clean and modern UI
- 🔧 **Configurable** – Highly customizable
- 📦 **Lightweight** – Minimal dependencies
- 🌍 **Universal** – Works everywhere

:::

::: section #installation

## 📦 Installation

### npm

```bash #install-npm .copy-button
npm install {npm_package}
```

### yarn

```bash #install-yarn
yarn add {npm_package}
```

### pnpm

```bash #install-pnpm
pnpm add {npm_package}
```

:::

::: section #quick-start

## 🚀 Quick Start

```javascript #quickstart
import { awesome } from '{npm_package}';

const result = awesome.doSomething({
  option1: true,
  option2: 'value'
});

console.log(result);
```

:::

::: section #usage

## 📖 Usage

### Basic Example

```javascript #basic-example
import { Awesome } from '{npm_package}';

const instance = new Awesome({
  mode: 'production',
  debug: false
});

await instance.initialize();
```

### Advanced Example

```javascript #advanced-example
import { Awesome, Plugin } from '{npm_package}';

const instance = new Awesome({
  plugins: [
    new Plugin.Logger(),
    new Plugin.Cache()
  ],
  config: {
    timeout: 5000,
    retries: 3
  }
});

// Use with async/await
const result = await instance.execute('task');
console.log(result);
```

:::

::: section #api

## 📚 API Reference

### Constructor

```typescript #constructor
new Awesome(options?: AwesomeOptions)
```

**Options:**

- code:mode[.param] (string) – Operation mode (strong:required[.required])
- code:debug[.param] (boolean) – Enable debug mode
- code:plugins[.param] (Plugin[]) – Array of plugins

### Methods

#### code:initialize()[.method]

Initialize the instance.

```typescript
async initialize(): Promise<void>
```

#### code:execute(task)[.method]

Execute a task.

```typescript
async execute(task: string): Promise<Result>
```

:::

::: note #typescript .info
---
icon: 📘
---

### TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import type { AwesomeOptions, Result } from '{npm_package}';
```

:::

::: section #contributing

## 🤝 Contributing

Contributions are welcome! Please read our link:CONTRIBUTING.md[.doc-link] for details.

### Development Setup

```bash #dev-setup
# Clone repository
git clone {repository}.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

:::

::: section #changelog

## 📝 Changelog

### Version {version} – {last_release|date:YYYY-MM-DD}

- ✨ Added new feature X
- 🐛 Fixed bug in Y
- 📚 Updated documentation
- ⚡️ Performance improvements

See link:CHANGELOG.md[.doc-link] for complete history.

:::

::: footer #readme-footer
---
social: true
---

## 📄 License

Licensed under the strong:{license} License[.license].

See link:LICENSE[.doc-link] for details.

---

Made with ❤️ by the {title} team

link:GitHub[.social-link] • link:Twitter[.social-link] • link:Discord[.social-link]

:::
```

---

## Summary

These examples demonstrate how Blocks can be used for various documentation needs:

1. **API Documentation** – Structured endpoint documentation with code examples
2. **Tutorials** – Step-by-step guides with interactive elements
3. **Blog Posts** – Rich content with metadata and social features
4. **Technical Specifications** – Formal documentation with strict formatting
5. **Project READMEs** – Comprehensive project documentation

Each example showcases different features:
- Global and local metadata
- Variable interpolation and filters
- Inline elements with attributes
- Code blocks with syntax highlighting
- Nested sections and blocks
- Custom styling with classes and IDs

For more information, see:
- [Syntax Specification](./syntax.md)
- [Cheatsheet](../cheatsheet.html)
- [README](../README.md)
