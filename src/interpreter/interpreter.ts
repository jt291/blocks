import type {
  BlockNode,
  DocumentNode,
  GenericBlockNode,
  GenericInlineNode,
  InlineNode,
  ScriptNode,
  TextNode,
} from "../parser/ast.js";

/**
 * Context for script evaluation
 */
export interface EvaluationContext {
  variables: Record<string, any>;
  functions?: Record<string, Function>;
}

/**
 * Interpreter evaluates script expressions in the AST
 * 
 * ⚠️ SECURITY WARNING: This interpreter uses the Function constructor to evaluate
 * JavaScript expressions. This means it can execute arbitrary JavaScript code provided
 * in script expressions. Only use this with trusted input, or implement additional
 * sandboxing/validation before passing user input to the interpreter.
 * 
 * Consider these security best practices:
 * - Validate and sanitize all input before parsing
 * - Restrict the variables available in the context
 * - Run in a sandboxed environment if processing untrusted input
 * - Monitor for suspicious expressions or patterns
 */
export class Interpreter {
  private context: EvaluationContext;

  constructor(context: EvaluationContext = { variables: {} }) {
    this.context = context;
  }

  /**
   * Evaluate all scripts in the AST
   */
  evaluate(ast: DocumentNode): DocumentNode {
    return {
      ...ast,
      children: ast.children.map((child) => this.visitDocumentChild(child)),
    };
  }

  /**
   * Visit a document-level child node
   */
  private visitDocumentChild(
    node: BlockNode | InlineNode | ScriptNode | TextNode,
  ): BlockNode | InlineNode | ScriptNode | TextNode {
    const nodeType = node.type;

    if (nodeType === "Script") {
      return this.evaluateScript(node as ScriptNode);
    }
    if (nodeType === "GenericBlock") {
      return this.visitGenericBlock(node as GenericBlockNode);
    }
    if (nodeType === "GenericInline") {
      return this.visitGenericInline(node as GenericInlineNode);
    }
    // Text, comments, code blocks don't need evaluation
    return node;
  }

  /**
   * Visit generic block and evaluate its content
   */
  private visitGenericBlock(node: GenericBlockNode): GenericBlockNode {
    return {
      ...node,
      content: node.content.map((child) => this.visitGenericBlockChild(child)),
    };
  }

  /**
   * Visit a generic block child node
   */
  private visitGenericBlockChild(
    node: BlockNode | InlineNode | ScriptNode | TextNode,
  ): BlockNode | InlineNode | ScriptNode | TextNode {
    const nodeType = node.type;

    if (nodeType === "Script") {
      return this.evaluateScript(node as ScriptNode);
    }
    if (nodeType === "GenericBlock") {
      return this.visitGenericBlock(node as GenericBlockNode);
    }
    if (nodeType === "GenericInline") {
      return this.visitGenericInline(node as GenericInlineNode);
    }
    return node;
  }

  /**
   * Visit generic inline and evaluate its content
   */
  private visitGenericInline(node: GenericInlineNode): GenericInlineNode {
    return {
      ...node,
      content: node.content.map((child) => this.visitGenericInlineChild(child)),
    };
  }

  /**
   * Visit a generic inline child node
   */
  private visitGenericInlineChild(
    node: InlineNode | ScriptNode | TextNode,
  ): InlineNode | ScriptNode | TextNode {
    const nodeType = node.type;

    if (nodeType === "Script") {
      return this.evaluateScript(node as ScriptNode);
    }
    if (nodeType === "GenericInline") {
      return this.visitGenericInline(node as GenericInlineNode);
    }
    return node;
  }

  /**
   * Evaluate a script expression using Function constructor
   */
  private evaluateScript(node: ScriptNode): ScriptNode {
    if (node.evaluated) {
      // Already evaluated
      return node;
    }

    try {
      // Get variable names and values from context
      const varNames = Object.keys(this.context.variables);
      const varValues = Object.values(this.context.variables);

      // Create function: (var1, var2, ...) => expression
      // Use indirect eval via Function constructor for safety
      const func = new Function(...varNames, `return (${node.content});`);

      // Execute with context variables
      const result = func(...varValues);

      return {
        ...node,
        evaluated: true,
        result,
      };
    } catch (error: any) {
      // Return error as result
      return {
        ...node,
        evaluated: true,
        result: `[Error: ${error.message}]`,
      };
    }
  }

  /**
   * Update context variables
   */
  setContext(context: EvaluationContext) {
    this.context = context;
  }

  /**
   * Get current context
   */
  getContext(): EvaluationContext {
    return this.context;
  }
}

/**
 * Helper function to evaluate an AST with context
 */
export function evaluate(
  ast: DocumentNode,
  context?: EvaluationContext,
): DocumentNode {
  const interpreter = new Interpreter(context);
  return interpreter.evaluate(ast);
}
