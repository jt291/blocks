// AST Node Types

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export interface Attributes {
  id?: string;
  classes: string[];
  options: string[];
  keyValues: Record<string, string>;
}

// Base node types
export interface Node {
  type: string;
  location?: Location;
}

// Block nodes
export interface BlockNode extends Node {
  name?: string;
  attributes?: Attributes;
  content: string | InlineNode[];
}

export interface CommentBlockNode extends BlockNode {
  type: 'CommentBlock';
  content: string;
}

export interface CodeBlockNode extends BlockNode {
  type: 'CodeBlock';
  content: string;
}

export interface ScriptBlockNode extends BlockNode {
  type: 'ScriptBlock';
  content: string;
}

export interface GenericBlockNode extends Node {
  type: 'GenericBlock';
  name?: string;
  attributes?: Attributes;
  content: (BlockNode | InlineNode | TextNode)[];
}

// Inline nodes
export interface InlineNode extends Node {
  name?: string;
  attributes?: Attributes;
  content: string | InlineNode[];
}

export interface CommentInlineNode extends InlineNode {
  type: 'CommentInline';
  content: string;
}

export interface CodeInlineNode extends InlineNode {
  type: 'CodeInline';
  content: string;
}

export interface ScriptInlineNode extends InlineNode {
  type: 'ScriptInline';
  content: string;
}

export interface GenericInlineNode extends InlineNode {
  type: 'GenericInline';
  content: InlineNode[];
}

export interface TextNode extends Node {
  type: 'Text';
  value: string;
}

// Root document
export interface DocumentNode extends Node {
  type: 'Document';
  children: (BlockNode | InlineNode | TextNode)[];
}

// Type unions
export type AnyBlockNode = CommentBlockNode | CodeBlockNode | ScriptBlockNode | GenericBlockNode;
export type AnyInlineNode = CommentInlineNode | CodeInlineNode | ScriptInlineNode | GenericInlineNode | TextNode;
export type AnyNode = DocumentNode | AnyBlockNode | AnyInlineNode;
