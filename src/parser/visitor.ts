/**
 * CST to AST Visitor
 * 
 * Transforms Chevrotain's CST into our AST types.
 */

import { IToken } from "chevrotain";
import {
  DocumentNode,
  TextNode,
  CodeBlock,
  GenericBlock,
  ScriptNode,
  CodeInline,
  GenericInline,
  CommentBlockNode,
  CommentInlineNode,
  Attributes,
  Metadata,
  Position,
  Location,
} from "../types/ast";
import { createParser } from "./index";

const BaseBlocksVisitor = createParser().getBaseCstVisitorConstructor();

/**
 * Visitor to transform CST to AST
 */
export class BlocksVisitor extends BaseBlocksVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  /**
   * Visit document node
   */
  document(ctx: any): DocumentNode {
    const metadata = ctx.frontmatter ? this.visit(ctx.frontmatter) : undefined;
    const children: any[] = [];

    // Process all children
    if (ctx.blockElement) {
      children.push(...ctx.blockElement.map((el: any) => this.visit(el)));
    }
    if (ctx.inlineElement) {
      children.push(...ctx.inlineElement.map((el: any) => this.visit(el)));
    }
    if (ctx.comment) {
      children.push(...ctx.comment.map((c: any) => this.visit(c)));
    }
    if (ctx.textContent) {
      children.push(...ctx.textContent.map((t: any) => this.visit(t)));
    }

    return {
      type: "Document",
      metadata,
      children,
    };
  }

  /**
   * Visit frontmatter (YAML metadata)
   */
  frontmatter(ctx: any): Metadata {
    // Extract YAML content between --- delimiters
    const content = this.extractTextContent(ctx);
    
    // TODO: Parse YAML (for now, return raw string)
    return {
      _raw: content,
    };
  }

  /**
   * Visit code block
   */
  codeBlock(ctx: any): CodeBlock {
    const language = ctx.language ? ctx.language[0].image : undefined;
    const attributes = ctx.attributes ? this.visit(ctx.attributes[0]) : undefined;
    const contentTokens = this.extractContentTokens(ctx);
    const content: TextNode[] = contentTokens.map((token) => ({
      type: "Text",
      value: token.image,
      loc: this.getLocation(token),
    }));

    return {
      type: "CodeBlock",
      language,
      attributes,
      content,
      loc: this.getLocationFromCtx(ctx),
    };
  }

  /**
   * Visit generic block
   */
  genericBlock(ctx: any): GenericBlock {
    const name = ctx.name[0].image;
    const delimiter = ctx.open[0].image;
    const attributes = ctx.attributes ? this.visit(ctx.attributes[0]) : undefined;

    // Process nested content
    const children: any[] = [];
    if (ctx.blockElement) {
      children.push(...ctx.blockElement.map((el: any) => this.visit(el)));
    }
    if (ctx.inlineElement) {
      children.push(...ctx.inlineElement.map((el: any) => this.visit(el)));
    }
    if (ctx.comment) {
      children.push(...ctx.comment.map((c: any) => this.visit(c)));
    }
    
    // Add text nodes for all content tokens
    const contentTokens: IToken[] = [];
    if (ctx.Content) contentTokens.push(...ctx.Content);
    if (ctx.Identifier) {
      // Filter out the name token
      const nameToken = ctx.name?.[0];
      const contentIdentifiers = ctx.Identifier.filter((id: IToken) => id !== nameToken);
      contentTokens.push(...contentIdentifiers);
    }
    if (ctx.StringValue) contentTokens.push(...ctx.StringValue);
    if (ctx.Hash) contentTokens.push(...ctx.Hash);
    if (ctx.Dot) contentTokens.push(...ctx.Dot);
    if (ctx.Percent) contentTokens.push(...ctx.Percent);
    if (ctx.Equals) contentTokens.push(...ctx.Equals);
    
    // Sort tokens by position and add as text nodes
    contentTokens.sort((a, b) => (a.startOffset || 0) - (b.startOffset || 0));
    children.push(...contentTokens.map((t: IToken) => ({
      type: "Text",
      value: t.image,
      loc: this.getLocation(t),
    })));

    return {
      type: "GenericBlock",
      name,
      delimiter,
      attributes,
      content: children,
      loc: this.getLocationFromCtx(ctx),
    };
  }

  /**
   * Visit script block
   */
  scriptBlock(ctx: any): ScriptNode {
    const content = this.extractTextContent(ctx);

    return {
      type: "Script",
      content,
      loc: this.getLocationFromCtx(ctx),
    };
  }

  /**
   * Visit inline code
   */
  inlineCode(ctx: any): CodeInline {
    const token = ctx.InlineCodeComplete?.[0] || ctx.InlineCodeCompleteWithAttrs?.[0];
    const { content, attributes } = this.parseInlineToken(token.image, "`");

    return {
      type: "CodeInline",
      name: "code",
      content: [{ type: "Text", value: content }],
      attributes,
      loc: this.getLocation(token),
    };
  }

  /**
   * Visit inline generic
   */
  inlineGeneric(ctx: any): GenericInline {
    const token = ctx.InlineGenericComplete?.[0] || ctx.InlineGenericCompleteWithAttrs?.[0];
    const { content, attributes } = this.parseInlineToken(token.image, ":");

    return {
      type: "GenericInline",
      name: "span",
      content: [{ type: "Text", value: content }],
      attributes,
      loc: this.getLocation(token),
    };
  }

  /**
   * Visit inline script
   */
  inlineScript(ctx: any): ScriptNode {
    const token = ctx.InlineScriptComplete?.[0] || ctx.InlineScriptCompleteWithAttrs?.[0];
    const { content } = this.parseInlineToken(token.image, "!");

    return {
      type: "Script",
      content,
      loc: this.getLocation(token),
    };
  }

  /**
   * Visit inline comment
   */
  inlineComment(ctx: any): CommentInlineNode {
    const content = this.extractTextContent(ctx);

    return {
      type: "CommentInline",
      content,
    };
  }

  /**
   * Visit block comment
   */
  blockComment(ctx: any): CommentBlockNode {
    const content = this.extractTextContent(ctx);

    return {
      type: "CommentBlock",
      content,
    };
  }

  /**
   * Visit attributes
   */
  attributes(ctx: any): Attributes {
    const attrs: Attributes = {
      classes: [],
      options: [],
      keyValues: {},
      events: {},
    };

    if (ctx.attrId) {
      attrs.id = ctx.attrId[0].children.id[0].image;
    }

    if (ctx.attrClass) {
      attrs.classes = ctx.attrClass.map((c: any) => c.children.class[0].image);
    }

    if (ctx.attrOption) {
      attrs.options = ctx.attrOption.map((o: any) => o.children.option[0].image);
    }

    if (ctx.attrKeyValue) {
      ctx.attrKeyValue.forEach((kv: any) => {
        const key = kv.children.key[0].image;
        const value = kv.children.value[0].image;
        attrs.keyValues[key] = value;
      });
    }

    return attrs;
  }

  /**
   * Visit text content
   */
  textContent(ctx: any): TextNode {
    const content = this.extractTextContent(ctx);

    return {
      type: "Text",
      value: content,
    };
  }

  /**
   * Visit block element (delegates to specific block type)
   */
  blockElement(ctx: any): any {
    if (ctx.codeBlock) {
      return this.visit(ctx.codeBlock);
    }
    if (ctx.genericBlock) {
      return this.visit(ctx.genericBlock);
    }
    if (ctx.scriptBlock) {
      return this.visit(ctx.scriptBlock);
    }
  }

  /**
   * Visit inline element (delegates to specific inline type)
   */
  inlineElement(ctx: any): any {
    if (ctx.inlineCode) {
      return this.visit(ctx.inlineCode);
    }
    if (ctx.inlineGeneric) {
      return this.visit(ctx.inlineGeneric);
    }
    if (ctx.inlineScript) {
      return this.visit(ctx.inlineScript);
    }
  }

  /**
   * Visit comment (delegates to specific comment type)
   */
  comment(ctx: any): any {
    if (ctx.inlineComment) {
      return this.visit(ctx.inlineComment);
    }
    if (ctx.blockComment) {
      return this.visit(ctx.blockComment);
    }
  }

  /**
   * Visit ID attribute
   */
  attrId(ctx: any): void {
    // Handled by attributes visitor
  }

  /**
   * Visit class attribute
   */
  attrClass(ctx: any): void {
    // Handled by attributes visitor
  }

  /**
   * Visit option attribute
   */
  attrOption(ctx: any): void {
    // Handled by attributes visitor
  }

  /**
   * Visit key-value attribute
   */
  attrKeyValue(ctx: any): void {
    // Handled by attributes visitor
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract text content from context
   */
  private extractTextContent(ctx: any): string {
    const tokens: IToken[] = this.extractContentTokens(ctx);
    return tokens.map((t) => t.image).join("");
  }

  /**
   * Extract content tokens from context
   */
  private extractContentTokens(ctx: any): IToken[] {
    const tokens: IToken[] = [];

    if (ctx.Content) tokens.push(...ctx.Content);
    if (ctx.Identifier) tokens.push(...ctx.Identifier);
    if (ctx.Whitespace) tokens.push(...ctx.Whitespace);
    if (ctx.Newline) tokens.push(...ctx.Newline);
    if (ctx.StringValue) tokens.push(...ctx.StringValue);
    if (ctx.Hash) tokens.push(...ctx.Hash);
    if (ctx.Dot) tokens.push(...ctx.Dot);
    if (ctx.Percent) tokens.push(...ctx.Percent);
    if (ctx.Equals) tokens.push(...ctx.Equals);
    if (ctx.InlineCodeComplete) tokens.push(...ctx.InlineCodeComplete);
    if (ctx.InlineGenericComplete) tokens.push(...ctx.InlineGenericComplete);
    if (ctx.InlineScriptComplete) tokens.push(...ctx.InlineScriptComplete);

    return tokens.sort((a, b) => (a.startOffset || 0) - (b.startOffset || 0));
  }

  /**
   * Parse inline token (extract content and attributes)
   */
  private parseInlineToken(
    image: string,
    delimiter: string
  ): { content: string; attributes?: Attributes } {
    // Pattern: delimiter + content + delimiter + optional{attrs}
    const withAttrs = image.match(
      new RegExp(`\\${delimiter}([^${delimiter}]*)\\${delimiter}\\s*\\{([^}]+)\\}`)
    );

    if (withAttrs) {
      const content = withAttrs[1];
      const attrsStr = withAttrs[2];
      const attributes = this.parseAttributesString(attrsStr);
      return { content, attributes };
    }

    // Without attributes
    const match = image.match(new RegExp(`\\${delimiter}([^${delimiter}]*)\\${delimiter}`));
    const content = match ? match[1] : "";

    return { content };
  }

  /**
   * Parse attributes from string
   */
  private parseAttributesString(str: string): Attributes {
    const attrs: Attributes = {
      classes: [],
      options: [],
      keyValues: {},
      events: {},
    };

    const parts = str.trim().split(/\s+/);

    parts.forEach((part) => {
      if (part.startsWith("#")) {
        attrs.id = part.slice(1);
      } else if (part.startsWith(".")) {
        attrs.classes.push(part.slice(1));
      } else if (part.startsWith("?")) {
        attrs.options.push(part.slice(1));
      } else if (part.includes("=")) {
        const [key, value] = part.split("=");
        if (key.startsWith("@")) {
          attrs.events[key.slice(1)] = value;
        } else {
          attrs.keyValues[key] = value;
        }
      }
    });

    return attrs;
  }

  /**
   * Get location from token
   */
  private getLocation(token: IToken): Location {
    return {
      start: {
        path: "unknown",
        line: token.startLine || 1,
        column: token.startColumn || 1,
        offset: token.startOffset || 0,
      },
      end: {
        path: "unknown",
        line: token.endLine || 1,
        column: token.endColumn || 1,
        offset: token.endOffset || 0,
      },
    };
  }

  /**
   * Get location from context
   */
  private getLocationFromCtx(ctx: any): Location {
    const tokens = Object.values(ctx)
      .flat()
      .filter((v): v is IToken => v && typeof v === "object" && "startOffset" in v);

    const first = tokens[0];
    const last = tokens[tokens.length - 1];

    return {
      start: {
        path: "unknown",
        line: first?.startLine || 1,
        column: first?.startColumn || 1,
        offset: first?.startOffset || 0,
      },
      end: {
        path: "unknown",
        line: last?.endLine || 1,
        column: last?.endColumn || 1,
        offset: last?.endOffset || 0,
      },
    };
  }
}

/**
 * Parse source code into AST
 */
export function parse(tokens: IToken[]): DocumentNode {
  const parser = createParser();
  const visitor = new BlocksVisitor();

  parser.input = tokens;
  const cst = parser.document();

  if (parser.errors.length > 0) {
    throw new Error(
      `Parse errors: ${parser.errors.map((e) => e.message).join(", ")}`
    );
  }

  return visitor.visit(cst);
}
