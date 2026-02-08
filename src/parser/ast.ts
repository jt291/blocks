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
  events: Record<string, string>;
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
  type: "CommentBlock";
  content: string;
}

export interface CodeBlockNode extends BlockNode {
  type: "CodeBlock";
  content: string;
}

// GenericBlockNode extends Node directly (not BlockNode) to support nested blocks.
// The content type needs to include BlockNode for nesting, which would conflict
// with BlockNode's content type of `string | InlineNode[]`.
export interface GenericBlockNode extends Node {
  type: "GenericBlock";
  name?: string;
  attributes?: Attributes;
  content: (BlockNode | InlineNode | TextNode)[];
}

// Inline nodes
export interface InlineNode extends Node {
  name?: string;
  attributes?: Attributes;
  content: string | (InlineNode | TextNode)[];
}

export interface CommentInlineNode extends InlineNode {
  type: "CommentInline";
  content: string;
}

export interface CodeInlineNode extends InlineNode {
  type: "CodeInline";
  content: string;
}

export interface GenericInlineNode extends InlineNode {
  type: "GenericInline";
  content: (InlineNode | TextNode)[];
}

export interface ScriptNode extends Node {
  type: "Script";
  content: string;
  evaluated?: boolean;
  result?: unknown;
}

export interface TextNode extends Node {
  type: "Text";
  value: string;
}

// Root document
export interface DocumentNode extends Node {
  type: "Document";
  children: (BlockNode | InlineNode | ScriptNode | TextNode)[];
}

// Type unions
export type AnyBlockNode =
  | CommentBlockNode
  | CodeBlockNode
  | GenericBlockNode;
export type AnyInlineNode =
  | CommentInlineNode
  | CodeInlineNode
  | GenericInlineNode
  | TextNode;
export type AnyNode = DocumentNode | AnyBlockNode | AnyInlineNode | ScriptNode;
