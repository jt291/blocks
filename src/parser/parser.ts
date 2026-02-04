import { EmbeddedActionsParser, IToken, TokenType } from 'chevrotain';
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

  // Comment block: /* name? attrs? content */
  private commentBlock = this.RULE('commentBlock', (): CommentBlockNode => {
    this.CONSUME(tokens.BlockCommentStart);
    
    // Try to consume name (first identifier if followed by { or space/content)
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier && this.LA(2).tokenType === tokens.LBrace) {
      name = this.CONSUME(tokens.Identifier);
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Consume all content until */
    const contentTokens: IToken[] = [];
    while (this.LA(1).tokenType !== tokens.BlockCommentEnd && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
    this.CONSUME(tokens.BlockCommentEnd);

    const node: CommentBlockNode = {
      type: 'CommentBlock',
      content: contentTokens.map(t => t.image).join('')
    };
    
    if (name) node.name = name.image;
    if (attributes) node.attributes = attributes;
    
    return node;
  });

  // Code block: ``` name? attrs? content ```
  private codeBlock = this.RULE('codeBlock', (): CodeBlockNode => {
    this.CONSUME(tokens.BlockCodeDelim);
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier && this.LA(2).tokenType === tokens.LBrace) {
      name = this.CONSUME(tokens.Identifier);
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Consume all content until ```
    const contentTokens: IToken[] = [];
    while (this.LA(1).tokenType !== tokens.BlockCodeDelim && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
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
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier && this.LA(2).tokenType === tokens.LBrace) {
      name = this.CONSUME(tokens.Identifier);
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Consume all content until !!!
    const contentTokens: IToken[] = [];
    while (this.LA(1).tokenType !== tokens.BlockScriptDelim && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
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
    
    // Try to consume name
    let name: IToken | undefined;
    if (this.LA(1).tokenType === tokens.Identifier && this.LA(2).tokenType === tokens.LBrace) {
      name = this.CONSUME(tokens.Identifier);
    }
    
    let attributes: Attributes | undefined;
    if (this.LA(1).tokenType === tokens.LBrace) {
      attributes = this.SUBRULE(this.attributes);
    }
    
    // Parse content (can contain inlines)
    const content: InlineNode[] = [];
    while (!(this.LA(1).tokenType === tokens.BlockGenericDelim && (this.LA(1) as IToken).image?.length === delimLength) && this.LA(1).tokenType !== tokens.EOF) {
      const child = this.OR([
        { ALT: () => this.SUBRULE(this.inlineElement), GATE: () => this.isInline(this.LA(1).tokenType) },
        { ALT: () => this.SUBRULE(this.textElement) }
      ]);
      if (child) content.push(child);
    }
    
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

  // Helper to check if token type is an inline starter
  private isInline(tokenType: TokenType): boolean {
    return tokenType === tokens.InlineCommentStart ||
           tokenType === tokens.InlineCodeDelim ||
           tokenType === tokens.InlineScriptDelim ||
           tokenType === tokens.InlineGenericDelim;
  }

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
    while (this.LA(1).tokenType !== tokens.Newline && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
    if (this.LA(1).tokenType === tokens.Newline) {
      this.CONSUME(tokens.Newline);
    }

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
      name = this.CONSUME(tokens.Identifier);
    }
    
    // Consume all content until `
    const contentTokens: IToken[] = [];
    while (this.LA(1).tokenType !== tokens.InlineCodeDelim && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
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
      name = this.CONSUME(tokens.Identifier);
    }
    
    // Consume all content until !
    const contentTokens: IToken[] = [];
    while (this.LA(1).tokenType !== tokens.InlineScriptDelim && this.LA(1).tokenType !== tokens.EOF) {
      contentTokens.push(this.CONSUME(this.LA(1).tokenType as TokenType));
    }
    
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
      name = this.CONSUME(tokens.Identifier);
    }
    
    // Parse content (can contain nested inlines)
    const content: InlineNode[] = [];
    while (this.LA(1).tokenType !== tokens.InlineGenericDelim && this.LA(1).tokenType !== tokens.EOF) {
      const child = this.OR([
        { ALT: () => this.SUBRULE(this.inlineElement), GATE: () => this.isInline(this.LA(1).tokenType) },
        { ALT: () => this.SUBRULE(this.textElement) }
      ]);
      if (child) content.push(child);
    }
    
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
      { ALT: () => this.CONSUME(tokens.Newline) }
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
