import { EmbeddedActionsParser, type IToken } from 'chevrotain';
import * as tokens from '../lexer/tokens.js';
import type {
  BlockNode,
  InlineNode,
  Attributes,
  TextNode,
  CommentBlockNode,
  CodeBlockNode,
  ScriptBlockNode,
  GenericBlockNode,
  CommentInlineNode,
  CodeInlineNode,
  ScriptInlineNode,
  GenericInlineNode
} from './ast.js';

export class BlocksParser extends EmbeddedActionsParser {
  constructor() {
    super(tokens.allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: 'full'
    });
    this.performSelfAnalysis();
  }

  // Main document rule
  public document = this.RULE('document', (): (BlockNode | InlineNode | TextNode)[] => {
    const children: (BlockNode | InlineNode | TextNode)[] = [];
    
    this.MANY(() => {
      const child = this.OR([
        { ALT: () => this.SUBRULE(this.blockElement) },
        { ALT: () => this.SUBRULE(this.inlineElement) },
        { ALT: () => this.SUBRULE(this.textElement) }
      ]);
      if (child) children.push(child);
    });

    return children;
  });

  // Block elements
  private blockElement = this.RULE('blockElement', (): BlockNode => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.commentBlock) },
      { ALT: () => this.SUBRULE(this.codeBlock) },
      { ALT: () => this.SUBRULE(this.scriptBlock) },
      { ALT: () => this.SUBRULE(this.genericBlock) }
    ]);
  });

  // Comment block: /* #name? content */
  // Simplified: only # prefix indicates name, no attributes ever
  private commentBlock = this.RULE('commentBlock', (): CommentBlockNode => {
    this.CONSUME(tokens.BlockCommentStart);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    const contentTokens: IToken[] = [];
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY2(() => {
        this.CONSUME3(tokens.Whitespace);
      });
    });
    
    // Consume all remaining content until */
    this.MANY3(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.CONSUME(tokens.BlockCommentEnd);

    const node: CommentBlockNode = {
      type: 'CommentBlock',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) {
      node.name = name;
    }
    
    return node;
  });

  // Code block: ```#name? {attrs?} content ```
  private codeBlock = this.RULE('codeBlock', (): CodeBlockNode => {
    this.CONSUME(tokens.BlockCodeDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    let attributes: Attributes | undefined;
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });
    
    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });
    
    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) }
      ]);
    });
    
    // Consume all content until ```
    const contentTokens: IToken[] = [];
    this.MANY4(() => {
      const tok = this.OR2([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME4(tokens.Whitespace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.CONSUME2(tokens.BlockCodeDelim);

    const node: CodeBlockNode = {
      type: 'CodeBlock',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Script block: !!!#name? {attrs?} content !!!
  private scriptBlock = this.RULE('scriptBlock', (): ScriptBlockNode => {
    this.CONSUME(tokens.BlockScriptDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    let attributes: Attributes | undefined;
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });
    
    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });
    
    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) }
      ]);
    });
    
    // Consume all content until !!!
    const contentTokens: IToken[] = [];
    this.MANY4(() => {
      const tok = this.OR2([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME4(tokens.Whitespace) },
        { ALT: () => this.CONSUME2(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.CONSUME2(tokens.BlockScriptDelim);

    const node: ScriptBlockNode = {
      type: 'ScriptBlock',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Generic block: :::#name? {attrs?} content :::
  private genericBlock = this.RULE('genericBlock', (): GenericBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockGenericDelim);
    const delimLength = openDelim.image.length;
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    let attributes: Attributes | undefined;
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    });
    
    // Try to consume attributes
    this.OPTION2(() => {
      attributes = this.SUBRULE(this.attributes);
    });
    
    // Skip whitespace/newline after name or attributes
    this.MANY3(() => {
      this.OR([
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) }
      ]);
    });
    
    // Parse content (can contain inlines)
    const content: InlineNode[] = [];
    this.MANY4({
      GATE: () => {
        // Check if we've reached the closing delimiter with same length
        const tok = this.LA(1) as IToken;
        return !(tok.tokenType === tokens.BlockGenericDelim && 
                 tok.image !== undefined && 
                 tok.image.length === delimLength);
      },
      DEF: () => {
        const child = this.OR2([
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.textElement) }
        ]);
        if (child) content.push(child);
      }
    });
    
    const closeDelim = this.CONSUME2(tokens.BlockGenericDelim);
    
    // Check that opening and closing delimiters have the same length
    if (openDelim.image.length !== closeDelim.image.length) {
      throw new Error(`Generic block delimiters must have the same length: ${openDelim.image} vs ${closeDelim.image}`);
    }

    const node: GenericBlockNode = {
      type: 'GenericBlock',
      content
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Inline elements
  private inlineElement = this.RULE('inlineElement', (): InlineNode => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.commentInline) },
      { ALT: () => this.SUBRULE(this.codeInline) },
      { ALT: () => this.SUBRULE(this.scriptInline) },
      { ALT: () => this.SUBRULE(this.genericInline) }
    ]);
  });

  // Comment inline: // #name? content\n
  private commentInline = this.RULE('commentInline', (): CommentInlineNode => {
    this.CONSUME(tokens.InlineCommentStart);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    const contentTokens: IToken[] = [];
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY3(() => {
        this.CONSUME3(tokens.Whitespace);
      });
    });
    
    // Consume all remaining content until newline or EOF
    this.MANY2(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.OPTION2(() => this.CONSUME(tokens.Newline));

    const node: CommentInlineNode = {
      type: 'CommentInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) {
      node.name = name;
    }
    
    return node;
  });

  // Code inline: ` #name? content ` attrs?
  private codeInline = this.RULE('codeInline', (): CodeInlineNode => {
    this.CONSUME(tokens.InlineCodeDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    const contentTokens: IToken[] = [];
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY4(() => {
        this.CONSUME4(tokens.Whitespace);
      });
    });
    
    // Consume all content until `
    this.MANY2(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.CONSUME2(tokens.InlineCodeDelim);
    
    let attributes: Attributes | undefined;
    this.OPTION2(() => {
      // Skip whitespace between closing delimiter and attributes
      this.MANY3(() => {
        this.CONSUME3(tokens.Whitespace);
      });
      if (this.LA(1).tokenType === tokens.LBrace) {
        attributes = this.SUBRULE(this.attributes);
      }
    });

    const node: CodeInlineNode = {
      type: 'CodeInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Script inline: ! #name? content ! attrs?
  private scriptInline = this.RULE('scriptInline', (): ScriptInlineNode => {
    this.CONSUME(tokens.InlineScriptDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    const contentTokens: IToken[] = [];
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY4(() => {
        this.CONSUME4(tokens.Whitespace);
      });
    });
    
    // Consume all content until !
    this.MANY2(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME2(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME2(tokens.Hash) },
        { ALT: () => this.CONSUME(tokens.Dot) },
        { ALT: () => this.CONSUME(tokens.Percent) },
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.StringValue) },
        { ALT: () => this.CONSUME(tokens.AnyChar) },
        { ALT: () => this.CONSUME(tokens.BlockCommentStart) },
        { ALT: () => this.CONSUME(tokens.BlockCommentEnd) },
        { ALT: () => this.CONSUME(tokens.BlockCodeDelim) },
        { ALT: () => this.CONSUME(tokens.BlockScriptDelim) },
        { ALT: () => this.CONSUME(tokens.BlockGenericDelim) }
      ]);
      if (tok) contentTokens.push(tok);
    });
    
    this.CONSUME2(tokens.InlineScriptDelim);
    
    let attributes: Attributes | undefined;
    this.OPTION2(() => {
      // Skip whitespace between closing delimiter and attributes
      this.MANY3(() => {
        this.CONSUME3(tokens.Whitespace);
      });
      if (this.LA(1).tokenType === tokens.LBrace) {
        attributes = this.SUBRULE(this.attributes);
      }
    });

    const node: ScriptInlineNode = {
      type: 'ScriptInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Generic inline: : #name? content : attrs?
  private genericInline = this.RULE('genericInline', (): GenericInlineNode => {
    this.CONSUME(tokens.InlineGenericDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    let name: string | undefined;
    
    // Try to consume name if it starts with #
    this.OPTION(() => {
      this.CONSUME(tokens.Hash);
      const nameToken = this.CONSUME(tokens.Identifier);
      name = nameToken.image;
      // Skip whitespace after name (should not be part of content)
      this.MANY4(() => {
        this.CONSUME4(tokens.Whitespace);
      });
    });
    
    // Parse content (can contain nested inlines)
    const content: InlineNode[] = [];
    
    // Use MANY with GATE to check for closing delimiter
    this.MANY2({
      GATE: () => this.LA(1).tokenType !== tokens.InlineGenericDelim,
      DEF: () => {
        const child = this.OR([
          { ALT: () => this.SUBRULE(this.inlineElement) },
          { ALT: () => this.SUBRULE(this.textElement) }
        ]);
        if (child) content.push(child);
      }
    });
    
    this.CONSUME2(tokens.InlineGenericDelim);
    
    let attributes: Attributes | undefined;
    this.OPTION2(() => {
      // Skip whitespace between closing delimiter and attributes
      this.MANY3(() => {
        this.CONSUME2(tokens.Whitespace);
      });
      if (this.LA(1).tokenType === tokens.LBrace) {
        attributes = this.SUBRULE(this.attributes);
      }
    });

    const node: GenericInlineNode = {
      type: 'GenericInline',
      content
    };
    
    if (name) node.name = name;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Text element
  private textElement = this.RULE('textElement', (): TextNode => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.Content) },
      { ALT: () => this.CONSUME(tokens.Whitespace) },
      { ALT: () => this.CONSUME(tokens.Newline) },
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.CONSUME(tokens.StringValue) },
      { ALT: () => this.CONSUME(tokens.LBrace) },
      { ALT: () => this.CONSUME(tokens.RBrace) },
      { ALT: () => this.CONSUME(tokens.Hash) },
      { ALT: () => this.CONSUME(tokens.Dot) },
      { ALT: () => this.CONSUME(tokens.Percent) },
      { ALT: () => this.CONSUME(tokens.Equals) },
      { ALT: () => this.CONSUME(tokens.AnyChar) }
    ]);

    const node: TextNode = {
      type: 'Text',
      value: token.image
    };
    
    return node;
  });

  // Attributes: { #id .class %option key=value }
  private attributes = this.RULE('attributes', (): Attributes => {
    this.CONSUME(tokens.LBrace);
    
    const attrs: Attributes = {
      classes: [],
      options: [],
      keyValues: {}
    };
    
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            // #id
            this.CONSUME(tokens.Hash);
            const id = this.CONSUME(tokens.Identifier);
            attrs.id = id.image;
          }
        },
        {
          ALT: () => {
            // .class
            this.CONSUME(tokens.Dot);
            const cls = this.CONSUME2(tokens.Identifier);
            attrs.classes.push(cls.image);
          }
        },
        {
          ALT: () => {
            // %option
            this.CONSUME(tokens.Percent);
            const opt = this.CONSUME3(tokens.Identifier);
            attrs.options.push(opt.image);
          }
        },
        {
          ALT: () => {
            // key=value
            const key = this.CONSUME4(tokens.Identifier);
            this.CONSUME(tokens.Equals);
            const value = this.OR2([
              { ALT: () => this.CONSUME(tokens.StringValue) },
              { ALT: () => this.CONSUME5(tokens.Identifier) }
            ]);
            attrs.keyValues[key.image] = value.image;
          }
        },
        {
          ALT: () => {
            // Skip whitespace
            this.CONSUME(tokens.Whitespace);
          }
        }
      ]);
    });
    
    this.CONSUME(tokens.RBrace);
    
    return attrs;
  });
}

export function createParser(): BlocksParser {
  return new BlocksParser();
}
