import type {
  BlockNode,
  CodeBlockNode,
  CodeInlineNode,
  CommentBlockNode,
  CommentInlineNode,
  DocumentNode,
  GenericBlockNode,
  GenericInlineNode,
  InlineNode,
  ScriptNode,
  TextNode,
} from "../parser/ast.js";

/**
 * Render options
 */
export interface RenderOptions {
  // Skip rendering comments (default: true)
  skipComments?: boolean;
  // Format code blocks with triple backticks (default: false)
  formatCodeBlocks?: boolean;
  // Include attributes in output (default: false)
  includeAttributes?: boolean;
}

/**
 * Renderer converts AST to string output
 */
export class Renderer {
  private options: Required<RenderOptions>;

  constructor(options: RenderOptions = {}) {
    this.options = {
      skipComments: options.skipComments ?? true,
      formatCodeBlocks: options.formatCodeBlocks ?? false,
      includeAttributes: options.includeAttributes ?? false,
    };
  }

  /**
   * Render document to string
   */
  render(ast: DocumentNode): string {
    return ast.children
      .map((child) => this.renderDocumentChild(child))
      .join("");
  }

  /**
   * Render a document-level child node
   */
  private renderDocumentChild(
    node: BlockNode | InlineNode | ScriptNode | TextNode,
  ): string {
    const nodeType = node.type;

    switch (nodeType) {
      case "Script":
        return this.renderScript(node as ScriptNode);

      case "Text":
        return this.renderText(node as TextNode);

      case "GenericBlock":
        return this.renderGenericBlock(node as GenericBlockNode);

      case "GenericInline":
        return this.renderGenericInline(node as GenericInlineNode);

      case "CodeBlock":
        return this.renderCodeBlock(node as CodeBlockNode);

      case "CodeInline":
        return this.renderCodeInline(node as CodeInlineNode);

      case "CommentBlock":
        return this.renderCommentBlock(node as CommentBlockNode);

      case "CommentInline":
        return this.renderCommentInline(node as CommentInlineNode);

      default:
        return "";
    }
  }

  /**
   * Render a generic block child node
   */
  private renderGenericBlockChild(
    node: BlockNode | InlineNode | ScriptNode | TextNode,
  ): string {
    const nodeType = node.type;

    switch (nodeType) {
      case "Script":
        return this.renderScript(node as ScriptNode);

      case "Text":
        return this.renderText(node as TextNode);

      case "GenericBlock":
        return this.renderGenericBlock(node as GenericBlockNode);

      case "GenericInline":
        return this.renderGenericInline(node as GenericInlineNode);

      case "CodeBlock":
        return this.renderCodeBlock(node as CodeBlockNode);

      case "CodeInline":
        return this.renderCodeInline(node as CodeInlineNode);

      case "CommentBlock":
        return this.renderCommentBlock(node as CommentBlockNode);

      case "CommentInline":
        return this.renderCommentInline(node as CommentInlineNode);

      default:
        return "";
    }
  }

  /**
   * Render a generic inline child node
   */
  private renderGenericInlineChild(
    node: InlineNode | ScriptNode | TextNode,
  ): string {
    const nodeType = node.type;

    switch (nodeType) {
      case "Script":
        return this.renderScript(node as ScriptNode);

      case "Text":
        return this.renderText(node as TextNode);

      case "GenericInline":
        return this.renderGenericInline(node as GenericInlineNode);

      case "CodeInline":
        return this.renderCodeInline(node as CodeInlineNode);

      case "CommentInline":
        return this.renderCommentInline(node as CommentInlineNode);

      default:
        return "";
    }
  }

  /**
   * Render script: use evaluated result if available
   */
  private renderScript(node: ScriptNode): string {
    if (node.evaluated && node.result !== undefined) {
      return String(node.result);
    }
    // Fallback: return original expression
    return `\${${node.content}}`;
  }

  /**
   * Render text node
   */
  private renderText(node: TextNode): string {
    return node.value;
  }

  /**
   * Render generic block
   */
  private renderGenericBlock(node: GenericBlockNode): string {
    const content = node.content
      .map((child) => this.renderGenericBlockChild(child))
      .join("");
    return content;
  }

  /**
   * Render generic inline
   */
  private renderGenericInline(node: GenericInlineNode): string {
    const content = node.content
      .map((child) => this.renderGenericInlineChild(child))
      .join("");
    return content;
  }

  /**
   * Render code block
   */
  private renderCodeBlock(node: CodeBlockNode): string {
    if (this.options.formatCodeBlocks) {
      const lang = node.name || "";
      return `\`\`\`${lang}\n${node.content}\`\`\`\n`;
    }
    return node.content;
  }

  /**
   * Render code inline
   */
  private renderCodeInline(node: CodeInlineNode): string {
    return node.content;
  }

  /**
   * Render comment block (skip by default)
   */
  private renderCommentBlock(node: CommentBlockNode): string {
    if (this.options.skipComments) {
      return "";
    }
    return `/* ${node.content} */`;
  }

  /**
   * Render comment inline (skip by default)
   */
  private renderCommentInline(node: CommentInlineNode): string {
    if (this.options.skipComments) {
      return "";
    }
    return `// ${node.content}`;
  }
}

/**
 * Helper function to render AST to string
 */
export function render(ast: DocumentNode, options?: RenderOptions): string {
  const renderer = new Renderer(options);
  return renderer.render(ast);
}
