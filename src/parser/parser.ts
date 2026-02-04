import { EmbeddedActionsParser, IToken } from 'chevrotain';
import * as tokens from '../lexer/tokens.js';
import {
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



  // Helper to check if we should parse name+attributes
  // Name is consumed if: Identifier [Whitespace]* LBrace
  private shouldConsumeName(): boolean {
    let idx = 1;
    if (this.LA(idx).tokenType !== tokens.Identifier) return false;
    idx++;
    // Skip whitespace
    while (this.LA(idx).tokenType === tokens.Whitespace) idx++;
    return this.LA(idx).tokenType === tokens.LBrace;
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

  // Code block: ``` name? attrs? content ```
  private codeBlock = this.RULE('codeBlock', (): CodeBlockNode => {
    this.CONSUME(tokens.BlockCodeDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.shouldConsumeName()) {
      name = this.CONSUME(tokens.Identifier);
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Consume all content until ```
    const contentTokens: IToken[] = [];
    this.MANY3(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME(tokens.Hash) },
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
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Script block: !!! name? attrs? content !!!
  private scriptBlock = this.RULE('scriptBlock', (): ScriptBlockNode => {
    this.CONSUME(tokens.BlockScriptDelim);
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.shouldConsumeName()) {
      name = this.CONSUME(tokens.Identifier);
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Consume all content until !!!
    const contentTokens: IToken[] = [];
    this.MANY3(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME3(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME2(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME(tokens.Hash) },
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
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Generic block: ::: name? attrs? content :::
  private genericBlock = this.RULE('genericBlock', (): GenericBlockNode => {
    const openDelim = this.CONSUME(tokens.BlockGenericDelim);
    const delimLength = openDelim.image.length;
    
    // Skip leading whitespace
    this.MANY(() => {
      this.CONSUME(tokens.Whitespace);
    });
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.shouldConsumeName()) {
      name = this.CONSUME(tokens.Identifier);
      // Skip whitespace after name
      this.MANY2(() => {
        this.CONSUME2(tokens.Whitespace);
      });
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Parse content (can contain inlines)
    const content: InlineNode[] = [];
    this.MANY3(() => {
      // Check if we've reached the closing delimiter
      if (this.LA(1).tokenType === tokens.BlockGenericDelim && 
          (this.LA(1) as IToken).image?.length === delimLength) {
        return;
      }
      
      const child = this.OR([
        { ALT: () => this.SUBRULE(this.inlineElement) },
        { ALT: () => this.SUBRULE(this.textElement) }
      ]);
      if (child) content.push(child);
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
    
    if (name) node.name = name.image;
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

  // Comment inline: // content\n
  private commentInline = this.RULE('commentInline', (): CommentInlineNode => {
    this.CONSUME(tokens.InlineCommentStart);
    
    // Consume all content until newline or EOF
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME(tokens.Hash) },
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
    
    this.OPTION(() => this.CONSUME(tokens.Newline));

    const node: CommentInlineNode = {
      type: 'CommentInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    return node;
  });

  // Code inline: ` name? content ` attrs?
  private codeInline = this.RULE('codeInline', (): CodeInlineNode => {
    this.CONSUME(tokens.InlineCodeDelim);
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier) {
      const possibleName = this.CONSUME(tokens.Identifier);
      // If next token is another content token (not `), it was the name
      if (this.LA(1).tokenType !== tokens.InlineCodeDelim) {
        name = possibleName;
      } else {
        // It was the content, add it back
        name = undefined;
      }
    }
    
    // Consume all content until `
    const contentTokens: IToken[] = [];
    if (!name && this.LA(1).tokenType === tokens.Identifier) {
      // The identifier we consumed was actually content
      // But we already consumed it, so we need a different approach
    }
    
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineScriptDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME(tokens.Hash) },
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
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }

    const node: CodeInlineNode = {
      type: 'CodeInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Script inline: ! name? content ! attrs?
  private scriptInline = this.RULE('scriptInline', (): ScriptInlineNode => {
    this.CONSUME(tokens.InlineScriptDelim);
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier) {
      const possibleName = this.CONSUME(tokens.Identifier);
      if (this.LA(1).tokenType !== tokens.InlineScriptDelim) {
        name = possibleName;
      }
    }
    
    // Consume all content until !
    const contentTokens: IToken[] = [];
    this.MANY(() => {
      const tok = this.OR([
        { ALT: () => this.CONSUME2(tokens.Identifier) },
        { ALT: () => this.CONSUME(tokens.Content) },
        { ALT: () => this.CONSUME(tokens.Whitespace) },
        { ALT: () => this.CONSUME(tokens.Newline) },
        { ALT: () => this.CONSUME(tokens.InlineCommentStart) },
        { ALT: () => this.CONSUME(tokens.InlineCodeDelim) },
        { ALT: () => this.CONSUME(tokens.InlineGenericDelim) },
        { ALT: () => this.CONSUME(tokens.LBrace) },
        { ALT: () => this.CONSUME(tokens.RBrace) },
        { ALT: () => this.CONSUME(tokens.Hash) },
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
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }

    const node: ScriptInlineNode = {
      type: 'ScriptInline',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Generic inline: : name? content : attrs?
  private genericInline = this.RULE('genericInline', (): GenericInlineNode => {
    this.CONSUME(tokens.InlineGenericDelim);
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier) {
      const possibleName = this.CONSUME(tokens.Identifier);
      if (this.LA(1).tokenType !== tokens.InlineGenericDelim) {
        name = possibleName;
      }
    }
    
    // Parse content (can contain nested inlines)
    const content: InlineNode[] = [];
    this.MANY(() => {
      const child = this.OR([
        { ALT: () => this.SUBRULE(this.inlineElement) },
        { ALT: () => this.SUBRULE(this.textElement) }
      ]);
      if (child) content.push(child);
    });
    
    this.CONSUME2(tokens.InlineGenericDelim);
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }

    const node: GenericInlineNode = {
      type: 'GenericInline',
      content
    };
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Text element
  private textElement = this.RULE('textElement', (): TextNode => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.Content) },
      { ALT: () => this.CONSUME(tokens.Whitespace) },
      { ALT: () => this.CONSUME(tokens.Newline) },
      { ALT: () => this.CONSUME(tokens.Identifier) }
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
