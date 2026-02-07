/**
 * AST Node Types for Blocks Language
 *
 * Based on specification: docs/SPECIFICATION.md
 */

// ============================================================================
// Position and Location
// ============================================================================

/**
 * Position in source file
 */
export interface Position {
  /** Source file path */
  path: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Absolute character offset (0-indexed) */
  offset: number;
}

/**
 * Location range in source file
 */
export interface Location {
  /** Start position */
  start: Position;
  /** End position */
  end: Position;
}

// ============================================================================
// Metadata and Attributes
// ============================================================================

/**
 * YAML primitive types
 */
export type YamlPrimitive = string | number | boolean | null;

/**
 * YAML value types (recursive)
 */
export type YamlValue =
  | YamlPrimitive
  | YamlValue[]
  | { [key: string]: YamlValue };

/**
 * Metadata object (YAML frontmatter)
 */
export type Metadata = Record<string, YamlValue>;

/**
 * Attributes for blocks and inline elements
 */
export interface Attributes {
  /** Element ID (#id) */
  id?: string;
  /** CSS classes (.class1 .class2) */
  classes: string[];
  /** Boolean options (?option1 ?option2) */
  options: string[];
  /** Key-value pairs (key=value) */
  keyValues: Record<string, string>;
  /** Event handlers (@event=handler) */
  events: Record<string, string>;
}

// ============================================================================
// Base Node
// ============================================================================

/**
 * Base interface for all AST nodes
 */
export interface Node {
  /** Node type discriminator */
  type: string;
  /** Source location (optional) */
  loc?: Location;
}

// ============================================================================
// Document Node
// ============================================================================

/**
 * Root document node
 */
export interface DocumentNode extends Node {
  type: "Document";
  loc?: Location;
  /** Global metadata (frontmatter) */
  metadata?: Metadata;
  /** Child nodes */
  children: (BlockNode | InlineNode | ScriptNode | TextNode | CommentNode)[];
}

// ============================================================================
// Text Node
// ============================================================================

/**
 * Plain text content
 */
export interface TextNode extends Node {
  type: "Text";
  loc?: Location;
  /** Text content */
  value: string;
}

// ============================================================================
// Comment Nodes
// ============================================================================

/**
 * Base comment node
 */
export interface CommentNode extends Node {
  type: "CommentNode" | "CommentBlock" | "CommentInline";
  loc?: Location;
  /** Comment content */
  content: string;
}

/**
 * Multi-line comment: /* ... *\/
 */
export interface CommentBlockNode extends CommentNode {
  type: "CommentBlock";
  loc?: Location;
  content: string;
}

/**
 * Single-line comment: // ...
 */
export interface CommentInlineNode extends CommentNode {
  type: "CommentInline";
  loc?: Location;
  content: string;
}

// ============================================================================
// Script Node
// ============================================================================

/**
 * JavaScript expression: ${ ... }
 */
export interface ScriptNode extends Node {
  type: "Script";
  loc?: Location;
  /** JavaScript code */
  content: string;
  /** Whether the script has been evaluated */
  evaluated?: boolean;
  /** Evaluation result */
  result?: unknown;
}

// ============================================================================
// Inline Nodes
// ============================================================================

/**
 * Base inline element
 */
export interface InlineNode extends Node {
  type: "InlineNode" | "CodeInline" | "GenericInline";
  loc?: Location;
  /** Element name (required) */
  name: string;
  /** Attributes */
  attributes?: Attributes;
  /** Child content */
  content: (InlineNode | ScriptNode | TextNode)[];
}

/**
 * Inline code: name`content`[attributes]
 */
export interface CodeInline extends InlineNode {
  type: "CodeInline";
  loc?: Location;
  name: string;
  attributes?: Attributes;
  content: (ScriptNode | TextNode)[];
}

/**
 * Generic inline: name:content[attributes]
 */
export interface GenericInline extends InlineNode {
  type: "GenericInline";
  loc?: Location;
  name: string;
  attributes?: Attributes;
  content: (InlineNode | ScriptNode | TextNode)[];
}

// ============================================================================
// Block Nodes
// ============================================================================

/**
 * Base block element
 */
export interface BlockNode extends Node {
  type: "BlockNode" | "CodeBlock" | "GenericBlock";
  loc?: Location;
  /** Block name */
  name?: string;
  /** Attributes */
  attributes?: Attributes;
  /** Local metadata */
  metadata?: Metadata;
  /** Child content */
  content: (InlineNode | ScriptNode | TextNode | BlockNode | CommentNode)[];
}

/**
 * Code block: ``` language ... ```
 */
export interface CodeBlock extends BlockNode {
  type: "CodeBlock";
  loc?: Location;
  /** Programming language */
  language?: string;
  attributes?: Attributes;
  metadata?: Metadata;
  /** Code content (text only) */
  content: TextNode[];
}

/**
 * Generic block: ::: name ... :::
 */
export interface GenericBlock extends BlockNode {
  type: "GenericBlock";
  loc?: Location;
  /** Block name (required) */
  name: string;
  /** Delimiter string (":::", "::::", etc.) */
  delimiter: string;
  attributes?: Attributes;
  metadata?: Metadata;
  /** Mixed content */
  content: (TextNode | ScriptNode | InlineNode | BlockNode | CommentNode)[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard: check if node is DocumentNode
 */
export function isDocumentNode(node: Node): node is DocumentNode {
  return node.type === "Document";
}

/**
 * Type guard: check if node is TextNode
 */
export function isTextNode(node: Node): node is TextNode {
  return node.type === "Text";
}

/**
 * Type guard: check if node is CommentNode
 */
export function isCommentNode(node: Node): node is CommentNode {
  return node.type === "CommentBlock" || node.type === "CommentInline";
}

/**
 * Type guard: check if node is ScriptNode
 */
export function isScriptNode(node: Node): node is ScriptNode {
  return node.type === "Script";
}

/**
 * Type guard: check if node is InlineNode
 */
export function isInlineNode(node: Node): node is InlineNode {
  return node.type === "CodeInline" || node.type === "GenericInline";
}

/**
 * Type guard: check if node is BlockNode
 */
export function isBlockNode(node: Node): node is BlockNode {
  return node.type === "CodeBlock" || node.type === "GenericBlock";
}

/**
 * Type guard: check if node is CodeBlock
 */
export function isCodeBlock(node: Node): node is CodeBlock {
  return node.type === "CodeBlock";
}

/**
 * Type guard: check if node is GenericBlock
 */
export function isGenericBlock(node: Node): node is GenericBlock {
  return node.type === "GenericBlock";
}

/**
 * Type guard: check if node is CodeInline
 */
export function isCodeInline(node: Node): node is CodeInline {
  return node.type === "CodeInline";
}

/**
 * Type guard: check if node is GenericInline
 */
export function isGenericInline(node: Node): node is GenericInline {
  return node.type === "GenericInline";
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Union of all node types
 */
export type AnyNode =
  | DocumentNode
  | TextNode
  | CommentBlockNode
  | CommentInlineNode
  | ScriptNode
  | CodeInline
  | GenericInline
  | CodeBlock
  | GenericBlock;

/**
 * Union of all inline node types
 */
export type AnyInlineNode = CodeInline | GenericInline;

/**
 * Union of all block node types
 */
export type AnyBlockNode = CodeBlock | GenericBlock;

/**
 * Union of all comment node types
 */
export type AnyCommentNode = CommentBlockNode | CommentInlineNode;

/**
 * Nodes that can appear in block content
 */
export type BlockContentNode =
  | TextNode
  | ScriptNode
  | InlineNode
  | BlockNode
  | CommentNode;

/**
 * Nodes that can appear in inline content
 */
export type InlineContentNode = TextNode | ScriptNode | InlineNode;
