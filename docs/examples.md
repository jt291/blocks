# Blocks Language Examples

Comprehensive examples demonstrating all features of the Blocks language.

## Table of Contents

1. [Basic Blocks](#basic-blocks)
2. [Blocks with Attributes](#blocks-with-attributes)
3. [Inline Elements](#inline-elements)
4. [Variables](#variables)
5. [Metadata](#metadata)
6. [Real-World Examples](#real-world-examples)

---

## Basic Blocks

### Simple Comment Block

```blocks
/* This is a simple comment */
```

### Named Comment Block

```blocks
/* #include header.blocks */
/* #ifdef DEBUG */
/* #todo Implement feature */
```

### Code Block (Backticks)

```blocks
``` python
def hello():
    print("Hello, World!")
```
```

### Code Block (Exclamation Marks)

```blocks
!!! javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
!!!
```

### Generic Block

```blocks
::: note
This is a simple note block.
:::
```

### Nested Generic Blocks

```blocks
:::
Outer block content

:::::
Inner block with more colons
:::::

Back to outer block
:::
```

---

## Blocks with Attributes

### Block with ID

```blocks
::: section #main-content
Content of the main section
:::
```

### Block with Classes

```blocks
::: note .important .highlighted
This note has two classes
:::
```

### Block with Options

```blocks
::: alert %closable %dismissible
This alert can be closed and dismissed
:::
```

### Block with Key-Value Attributes

```blocks
::: video src="video.mp4" autoplay=true width=640 height=480
Video content
:::
```

### Block with All Attribute Types

```blocks
::: warning #main-alert .urgent .animated %closable %sound level=critical timeout=5000 retry=3
This is a warning with:
- ID: main-alert
- Classes: urgent, animated
- Options: closable, sound
- Attributes: level=critical, timeout=5000, retry=3
:::
```

### Code Block with Attributes

```blocks
``` python #example-code .highlighted %linenos start=1 theme=monokai
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
```
```

### Alternative Code Block with Attributes

```blocks
!!! javascript #interactive-demo .editable %live mode=preview height=200
const greeting = "Hello, World!";
console.log(greeting);

// Try editing this code
function add(a, b) {
  return a + b;
}
!!!
```

---

## Inline Elements

### Basic Inline Code

```blocks
Use the code:print() function to display output.
```

### Inline Code with Attributes

```blocks
Run code:npm install[.command %copy] to install dependencies.
```

### Inline Links

```blocks
Visit link:https://example.com to learn more.
```

### Inline Links with Attributes

```blocks
Check out link:https://github.com[#github-link .external target="_blank"] for more info.
```

### Inline Emphasis

```blocks
This is strong:very important[.urgent %blink] information.
```

### Custom Inline Spans

```blocks
Status: span:active[.status .status-green data-status="active"]
```

### Multiple Inline Elements

```blocks
The code:getData() function returns a link:User[#user-type .type-link] object with strong:required[.required] fields.
```

### Inline Elements with Edge Cases

```blocks
Array access: code:arr[0][.highlight]
URL protocol: code:https://example.com[.url]
Path separator: code:C:\Users\name[.path]
Nested quotes: link:page["test"][title="Link's title"]
```

---

## Variables

### Simple Variables

```blocks
Hello, {username}!
Welcome to {siteName}.
```

### Variables with Filters

```blocks
Price: {price|currency:USD}
Date: {publishDate|date:YYYY-MM-DD}
Time: {timestamp|date:HH:mm:ss}
```

### Multiple Filter Examples

```blocks
Uppercase: {title|upper}
Lowercase: {name|lower}
Capitalize: {word|capitalize}
Truncate: {description|truncate:100}
Number format: {value|number:2}
JSON output: {data|json}
Escape HTML: {userInput|escape}
```

### Chained Filters

```blocks
{longText|lower|truncate:50}
{rawHtml|escape|truncate:100}
{number|number:2|currency:EUR}
```

### Interpolated Variables

```blocks
Image path: ${basePath}/images/${filename}.png
API endpoint: ${apiUrl}/users/${userId}
Resource URL: ${protocol}://${domain}${path}
```

### Complex Interpolation

```blocks
Theme: ${config.theme}/styles/${variant}.css
Data: ${data.users[0].name}
Nested: ${settings.app.version}
```

### Mixed Variables and Text

```blocks
Welcome {username}, your email is ${user.email}.
Today is {today|date:DD/MM/YYYY} at {now|date:HH:mm}.
Visit ${baseUrl}/profile/{userId} to update your info.
```

---

## Metadata

### Global Metadata

```blocks
---
title: My Document
author: John Doe
date: 2026-02-06
version: 1.0
published: true
tags:
  - documentation
  - examples
  - tutorial
config:
  theme: dark
  debug: false
  features:
    - comments
    - search
    - export
---

Document content starts here.
```

### Block with Local Metadata

```blocks
::: section #intro
---
layout: hero
background: gradient
padding: large
color: white
buttons:
  - label: Get Started
    url: /docs
  - label: Examples
    url: /examples
---

Section content with local metadata
:::
```

### Metadata Override

```blocks
---
theme: light
debug: false
language: en
---

::: section #main
---
theme: dark
debug: true
---
This section has dark theme and debug enabled (overrides global)
:::

::: section #secondary
This section inherits light theme and debug disabled (from global)
:::
```

### Complex Metadata Structure

```blocks
---
project:
  name: Blocks Language
  version: 1.0.0
  repository: https://github.com/jt291/blocks
authors:
  - name: John Doe
    email: john@example.com
    role: Lead Developer
  - name: Jane Smith
    email: jane@example.com
    role: Documentation
features:
  syntax:
    blocks: true
    inlines: true
    variables: true
    metadata: true
  preprocessor:
    includes: true
    conditionals: false
    macros: false
---

Content with complex metadata structure
```

---

## Real-World Examples

### Example 1: Technical Documentation

```blocks
---
title: API Reference Guide
version: 2.0
last_updated: 2026-02-06
author: Documentation Team
base_url: https://api.example.com
api_version: v2
---

::: article #api-reference .documentation
---
category: technical
audience: developers
difficulty: intermediate
---

# {title} - Version {version}

Last updated: {last_updated|date:DD MMMM YYYY}

::: section #authentication .api-section
---
required: true
importance: high
---

## Authentication

All API requests require authentication using a code:Bearer token[.auth-token %required].

### Example Request

``` bash #auth-example .copy-button
curl -H "Authorization: Bearer YOUR_TOKEN" \
     link:${base_url}/${api_version}/users[.api-url]
```

### Rate Limits

strong:1000 requests per hour[.rate-limit %info] per API key.

:::

::: section #endpoints .api-section
---
count: 15
categories: [users, posts, comments]
---

## Available Endpoints

### Users

- code:GET /users[.endpoint] - List all users
- code:GET /users/{id}[.endpoint] - Get user by ID
- code:POST /users[.endpoint] - Create new user
- code:PUT /users/{id}[.endpoint] - Update user
- code:DELETE /users/{id}[.endpoint] - Delete user

### Example Response

``` json #response-example .highlighted
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2026-02-06T10:30:00Z"
}
```

:::

::: warning #deprecation .important %closable
---
deprecated_endpoints:
  - /v1/users
  - /v1/posts
migration_deadline: 2026-06-01
---

strong:Deprecation Notice[.warning-title]

The following endpoints will be deprecated on {migration_deadline|date:DD MMMM YYYY}:

- code:/v1/users
- code:/v1/posts

Please migrate to link:${base_url}/${api_version}/[.migration-link] endpoints.

:::

:::
```

### Example 2: Blog Post

```blocks
---
title: Getting Started with Blocks
author: Jane Smith
published: 2026-02-05
updated: 2026-02-06
category: Tutorial
tags: [beginner, syntax, guide]
reading_time: 5
difficulty: beginner
excerpt: Learn the basics of Blocks markup language
---

::: article #blog-post .post-content
---
post_id: 42
comments_enabled: true
share_enabled: true
---

# {title}

::: metadata .post-meta
By strong:{author}[.author-name] • 
Published {published|date:DD MMM YYYY} • 
Updated {updated|date:DD MMM YYYY} •
{reading_time} min read
:::

::: section #introduction .intro-section
---
section_order: 1
---

{excerpt}

In this tutorial, you'll learn:
- Basic syntax of Blocks
- How to use attributes
- Working with variables
- Document metadata

:::

::: section #getting-started
---
section_order: 2
prerequisites: [text-editor, basic-markup-knowledge]
---

## Getting Started

First, create a file with the code:.block[.file-extension] extension:

``` bash #create-file .command
touch my-document.block
```

Then add some content:

``` blocks #example-content .syntax-demo
::: note #my-first-note .important
This is my first Blocks document!
:::
```

:::

::: section #next-steps
---
section_order: 3
---

## Next Steps

- Read the link:https://example.com/docs/syntax[.internal-link] guide
- Try the link:https://example.com/playground[.internal-link] interactive playground
- Check out link:https://example.com/examples[.internal-link] more examples

:::

::: note #feedback %closable
---
feedback_email: feedback@example.com
---

strong:Have feedback?[.note-title]

Send us your thoughts at link:{feedback_email}[.email-link].

:::

:::
```

### Example 3: Product Documentation

```blocks
---
product:
  name: SuperApp
  version: 3.5.0
  price: 29.99
  currency: USD
company:
  name: TechCorp
  website: https://techcorp.com
  support: support@techcorp.com
installation:
  platforms: [Windows, macOS, Linux]
  min_ram: 4
  min_disk: 500
  recommended_ram: 8
  recommended_disk: 1000
---

::: document #product-manual .manual
---
document_type: user-manual
version: 3.5
---

# {product.name} User Manual

Version {product.version}

::: section #overview .hero %centered
---
background: gradient
---

strong:Welcome to {product.name}![.hero-title]

The powerful application for professionals.

Price: strong:{product.price|currency:USD}[.price-tag] (one-time purchase)

:::

::: section #system-requirements .requirements
---
importance: high
---

## System Requirements

### Minimum Requirements

- strong:RAM:[.req-label] {installation.min_ram} GB
- strong:Disk Space:[.req-label] {installation.min_disk} MB
- strong:OS:[.req-label] {installation.platforms[0]}, {installation.platforms[1]}, or {installation.platforms[2]}

### Recommended

- strong:RAM:[.req-label] {installation.recommended_ram} GB
- strong:Disk Space:[.req-label] {installation.recommended_disk} MB

:::

::: section #installation .install-guide
---
step_count: 3
estimated_time: 10
---

## Installation

Follow these steps to install {product.name}:

::: step #step-1 .install-step %numbered
---
step_number: 1
---

### Download

Download the installer from link:{company.website}/download[.download-link %external].

:::

::: step #step-2 .install-step %numbered
---
step_number: 2
---

### Install

Run the installer:

``` bash #install-command .copy-button
sudo ./install-superapp.sh
```

:::

::: step #step-3 .install-step %numbered
---
step_number: 3
---

### Launch

Start the application:

``` bash #launch-command .copy-button
superapp --version
```

Expected output: code:SuperApp v{product.version}[.output]

:::

:::

::: section #support
---
contact_methods: [email, phone, chat]
---

## Support

Need help? Contact us:

- strong:Email:[.contact-label] link:{company.support}[.email-link]
- strong:Website:[.contact-label] link:{company.website}[.web-link %external]
- strong:Phone:[.contact-label] +1-800-TECHCORP

:::

::: warning #license .important
---
license_type: commercial
transferable: false
---

strong:License Information[.warning-title]

This is commercial software. 
One license allows installation on strong:3 devices[.license-limit].
License is strong:non-transferable[.license-note].

:::

:::
```

### Example 4: Tutorial with Code Examples

```blocks
---
tutorial:
  title: Building a REST API
  level: intermediate
  duration: 45
  language: JavaScript
  framework: Express.js
author: DevTeam
published: 2026-02-06
repo_url: https://github.com/example/tutorial-rest-api
---

::: tutorial #rest-api-tutorial .interactive-tutorial
---
interactive: true
exercises: 5
---

# {tutorial.title}

::: metadata .tutorial-meta
strong:Level:[.meta-label] {tutorial.level|capitalize} •
strong:Duration:[.meta-label] {tutorial.duration} minutes •
strong:Language:[.meta-label] {tutorial.language}
:::

::: section #introduction
---
section_type: intro
---

Learn to build a REST API using code:{tutorial.framework}[.framework-name].

Repository: link:{repo_url}[.repo-link %external]

:::

::: section #setup
---
section_number: 1
---

## Setup

Install dependencies:

``` bash #install-deps .command %copy
npm init -y
npm install express body-parser
```

:::

::: section #basic-server
---
section_number: 2
has_exercise: true
---

## Creating a Basic Server

Create code:server.js[.filename]:

``` javascript #server-basic .highlighted %editable
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Run the server:

``` bash #run-server .command
node server.js
```

::: note #exercise .exercise %interactive
---
exercise_number: 1
points: 10
---

strong:Exercise 1:[.exercise-title]

Modify the server to listen on port code:8080[.code] instead of code:3000[.code].

:::

:::

::: section #crud-operations
---
section_number: 3
has_exercise: true
---

## CRUD Operations

Add CRUD endpoints:

``` javascript #crud-endpoints .highlighted %editable
let users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
];

// GET all users
app.get('/users', (req, res) => {
  res.json(users);
});

// GET user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST create user
app.post('/users', (req, res) => {
  const user = {
    id: users.length + 1,
    name: req.body.name
  };
  users.push(user);
  res.status(201).json(user);
});

// PUT update user
app.put('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.name = req.body.name;
  res.json(user);
});

// DELETE user
app.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(index, 1);
  res.status(204).send();
});
```

::: note #exercise .exercise %interactive
---
exercise_number: 2
points: 20
---

strong:Exercise 2:[.exercise-title]

Add input validation to ensure the code:name[.code] field is not empty when creating or updating a user.

:::

:::

::: section #testing
---
section_number: 4
---

## Testing the API

Test with code:curl[.command]:

``` bash #test-commands .command %copy
# GET all users
curl http://localhost:3000/users

# POST create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'

# PUT update user
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}'

# DELETE user
curl -X DELETE http://localhost:3000/users/1
```

:::

::: section #conclusion
---
section_type: conclusion
---

## Conclusion

You've learned:
- ✅ Setting up an Express server
- ✅ Creating REST endpoints
- ✅ Implementing CRUD operations
- ✅ Testing with curl

strong:Next steps:[.next-title]
- Add database integration
- Implement authentication
- Add error handling

:::

::: note #repo .final-note %closable
Full source code: link:{repo_url}[.repo-link %external]
:::

:::
```

---

## See Also

- [Syntax Documentation (syntax.md)](./syntax.md) - Complete syntax specification
- [Language Specification (LANGUAGE.md)](../LANGUAGE.md) - Formal language spec
- [Cheatsheet](../cheatsheet.html) - Quick reference
- [Interactive Playground](../public/playground.html) - Try it live
