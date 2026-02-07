/**
 * Parser for Blocks Language
 * 
 * Transforms tokens into an Abstract Syntax Tree (AST).
 * Based on specification: docs/SPECIFICATION.md
 */

import { CstParser } from "chevrotain";
import {
  allTokens,
  BlockCodeDelim,
  BlockGenericDelim,
  BlockScriptDelim,
  BlockCommentStart,
  BlockCommentEnd,
  InlineCodeComplete,
  InlineCodeCompleteWithAttrs,
  InlineGenericComplete,
  InlineGenericCompleteWithAttrs,
  InlineScriptComplete,
  InlineScriptCompleteWithAttrs,
  InlineCommentStart,
  LBrace,
  RBrace,
  Hash,
  Dot,
  Percent,
  Equals,
  Identifier,
  StringValue,
  Content,
  Whitespace,
  Newline,
  EscapedHash,
  EscapedBacktick,
  EscapedColon,
  EscapedLBrace,
  EscapedRBrace,
  EscapedBackslash,
} from "../lexer/tokens";

/**
 * Blocks Parser using Chevrotain
 */
export class BlocksParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: false,
      nodeLocationTracking: "full",
    });

    this.performSelfAnalysis();
  }

  /**
   * Root rule: Document
   * 
   * A document contains optional frontmatter (YAML metadata)
   * followed by a sequence of blocks, inline elements, text, and comments.
   */
  public document = this.RULE("document", () => {
    this.OPTION(() => {
      this.SUBRULE(this.frontmatter);
    });

    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.blockElement) },
        { ALT: () => this.SUBRULE(this.inlineElement) },
        { ALT: () => this.SUBRULE(this.comment) },
        { ALT: () => this.SUBRULE(this.textContent) },
        { ALT: () => this.CONSUME(Whitespace) },
        { ALT: () => this.CONSUME(Newline) },
      ]);
    });
  });

  /**
   * Frontmatter: YAML metadata at document start
   * 
   * Syntax: --- ... ---
   */
  private frontmatter = this.RULE("frontmatter", () => {
    // Frontmatter starts with --- on its own line
    this.CONSUME(BlockGenericDelim, { LABEL: "open" });
    this.OPTION(() => this.CONSUME(Newline));

    // YAML content (any tokens until closing ---)
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(StringValue) },
        { ALT: () => this.CONSUME2(Whitespace) },
        { ALT: () => this.CONSUME2(Newline) },
      ]);
    });

    // Closing ---
    this.CONSUME2(BlockGenericDelim, { LABEL: "close" });
  });

  /**
   * Block Element
   * 
   * Can be:
   * - Code block: ``` language ... ```
   * - Generic block: ::: name ... :::
   * - Script block: !!! ... !!!
   */
  private blockElement = this.RULE("blockElement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.codeBlock) },
      { ALT: () => this.SUBRULE(this.genericBlock) },
      { ALT: () => this.SUBRULE(this.scriptBlock) },
    ]);
  });

  /**
   * Code Block
   * 
   * Syntax: ```#language [attributes] ... ```
   * Note: Language is prefixed with # in current implementation
   */
  private codeBlock = this.RULE("codeBlock", () => {
    this.CONSUME(BlockCodeDelim, { LABEL: "open" });

    // Optional whitespace
    this.OPTION(() => this.CONSUME(Whitespace));

    // Optional language (prefixed with #)
    this.OPTION2(() => {
      this.CONSUME(Hash);
      this.CONSUME(Identifier, { LABEL: "language" });
    });

    // Optional whitespace before attributes
    this.OPTION3(() => this.CONSUME2(Whitespace));

    // Optional attributes - use LA to check for LBrace
    this.OPTION4({
      GATE: () => this.LA(1).tokenType === LBrace,
      DEF: () => {
        this.SUBRULE(this.attributes);
      }
    });

    this.OPTION5(() => this.CONSUME(Newline));

    // Content (consume anything that's not a closing delimiter, but NOT braces which are for attributes)
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME2(Identifier) },
        { ALT: () => this.CONSUME3(Whitespace) },
        { ALT: () => this.CONSUME2(Newline) },
        { ALT: () => this.CONSUME(StringValue) },
        { ALT: () => this.CONSUME2(Hash) },
        { ALT: () => this.CONSUME(Dot) },
        { ALT: () => this.CONSUME(Percent) },
        { ALT: () => this.CONSUME(Equals) },
        { ALT: () => this.CONSUME(InlineCodeComplete) },
        { ALT: () => this.CONSUME(InlineGenericComplete) },
        { ALT: () => this.CONSUME(InlineScriptComplete) },
      ]);
    });

    // Closing delimiter
    this.CONSUME2(BlockCodeDelim, { LABEL: "close" });
  });

  /**
   * Generic Block
   * 
   * Syntax: :::#name [attributes] ... :::
   * Note: Name is prefixed with # in current implementation
   */
  private genericBlock = this.RULE("genericBlock", () => {
    this.CONSUME(BlockGenericDelim, { LABEL: "open" });

    // Optional whitespace
    this.OPTION(() => this.CONSUME(Whitespace));
    
    // Optional name (prefixed with #)
    this.OPTION2(() => {
      this.CONSUME(Hash);
      this.CONSUME(Identifier, { LABEL: "name" });
    });

    // Optional whitespace before attributes
    this.OPTION3(() => this.CONSUME2(Whitespace));

    // Optional attributes - use LA to check for LBrace
    this.OPTION4({
      GATE: () => this.LA(1).tokenType === LBrace,
      DEF: () => {
        this.SUBRULE(this.attributes);
      }
    });

    this.OPTION5(() => this.CONSUME(Newline));

    // Content (can contain nested blocks, inlines, text, but NOT braces which are for attributes)
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.blockElement) },
        { ALT: () => this.SUBRULE(this.inlineElement) },
        { ALT: () => this.SUBRULE(this.comment) },
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME2(Identifier) },
        { ALT: () => this.CONSUME3(Whitespace) },
        { ALT: () => this.CONSUME2(Newline) },
        { ALT: () => this.CONSUME(StringValue) },
        { ALT: () => this.CONSUME2(Hash) },
        { ALT: () => this.CONSUME(Dot) },
        { ALT: () => this.CONSUME(Percent) },
        { ALT: () => this.CONSUME(Equals) },
      ]);
    });

    // Closing delimiter
    this.CONSUME2(BlockGenericDelim, { LABEL: "close" });
  });

  /**
   * Script Block
   * 
   * Syntax: !!! ... !!!
   */
  private scriptBlock = this.RULE("scriptBlock", () => {
    this.CONSUME(BlockScriptDelim, { LABEL: "open" });
    this.OPTION(() => this.CONSUME(Newline));

    // JavaScript content
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(Whitespace) },
        { ALT: () => this.CONSUME2(Newline) },
      ]);
    });

    this.CONSUME2(BlockScriptDelim, { LABEL: "close" });
  });

  /**
   * Inline Element
   * 
   * Can be:
   * - Inline code: `content` or `content`{attrs}
   * - Inline generic: :content: or :content:{attrs}
   * - Inline script: !content! or !content!{attrs}
   */
  private inlineElement = this.RULE("inlineElement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.inlineCode) },
      { ALT: () => this.SUBRULE(this.inlineGeneric) },
      { ALT: () => this.SUBRULE(this.inlineScript) },
    ]);
  });

  /**
   * Inline Code
   */
  private inlineCode = this.RULE("inlineCode", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(InlineCodeCompleteWithAttrs);
        },
      },
      {
        ALT: () => {
          this.CONSUME(InlineCodeComplete);
        },
      },
    ]);
  });

  /**
   * Inline Generic
   */
  private inlineGeneric = this.RULE("inlineGeneric", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(InlineGenericCompleteWithAttrs);
        },
      },
      {
        ALT: () => {
          this.CONSUME(InlineGenericComplete);
        },
      },
    ]);
  });

  /**
   * Inline Script
   */
  private inlineScript = this.RULE("inlineScript", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(InlineScriptCompleteWithAttrs);
        },
      },
      {
        ALT: () => {
          this.CONSUME(InlineScriptComplete);
        },
      },
    ]);
  });

  /**
   * Comment
   * 
   * Can be:
   * - Inline comment: // ...
   * - Block comment: /* ... *\/
   */
  private comment = this.RULE("comment", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.inlineComment) },
      { ALT: () => this.SUBRULE(this.blockComment) },
    ]);
  });

  /**
   * Inline Comment: // ...
   */
  private inlineComment = this.RULE("inlineComment", () => {
    this.CONSUME(InlineCommentStart);

    // Content until end of line
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(Whitespace) },
      ]);
    });
  });

  /**
   * Block Comment: /* ... *\/
   */
  private blockComment = this.RULE("blockComment", () => {
    this.CONSUME(BlockCommentStart);

    // Content until closing
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Content) },
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(Whitespace) },
        { ALT: () => this.CONSUME(Newline) },
      ]);
    });

    this.CONSUME(BlockCommentEnd);
  });

  /**
   * Attributes
   * 
   * Syntax: {#id .class1 .class2 ?option key=value @event=handler}
   */
  private attributes = this.RULE("attributes", () => {
    this.CONSUME(LBrace);

    this.MANY(() => {
      this.OPTION(() => this.CONSUME(Whitespace));

      this.OR([
        { ALT: () => this.SUBRULE(this.attrId) },
        { ALT: () => this.SUBRULE(this.attrClass) },
        { ALT: () => this.SUBRULE(this.attrOption) },
        { ALT: () => this.SUBRULE(this.attrKeyValue) },
      ]);
    });

    this.OPTION2(() => this.CONSUME2(Whitespace));
    this.CONSUME(RBrace);
  });

  /**
   * ID Attribute: #id
   */
  private attrId = this.RULE("attrId", () => {
    this.CONSUME(Hash);
    this.CONSUME(Identifier, { LABEL: "id" });
  });

  /**
   * Class Attribute: .class
   */
  private attrClass = this.RULE("attrClass", () => {
    this.CONSUME(Dot);
    this.CONSUME(Identifier, { LABEL: "class" });
  });

  /**
   * Option Attribute: ?option
   */
  private attrOption = this.RULE("attrOption", () => {
    this.CONSUME(Percent);
    this.CONSUME(Identifier, { LABEL: "option" });
  });

  /**
   * Key-Value Attribute: key=value
   */
  private attrKeyValue = this.RULE("attrKeyValue", () => {
    this.CONSUME(Identifier, { LABEL: "key" });
    this.CONSUME(Equals);
    this.OR([
      { ALT: () => this.CONSUME(StringValue, { LABEL: "value" }) },
      { ALT: () => this.CONSUME2(Identifier, { LABEL: "value" }) },
    ]);
  });

  /**
   * Text Content
   * 
   * Plain text or escaped characters
   */
  private textContent = this.RULE("textContent", () => {
    this.OR([
      { ALT: () => this.CONSUME(Content) },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(EscapedHash) },
      { ALT: () => this.CONSUME(EscapedBacktick) },
      { ALT: () => this.CONSUME(EscapedColon) },
      { ALT: () => this.CONSUME(EscapedLBrace) },
      { ALT: () => this.CONSUME(EscapedRBrace) },
      { ALT: () => this.CONSUME(EscapedBackslash) },
    ]);
  });
}

/**
 * Create a parser instance
 */
export function createParser(): BlocksParser {
  return new BlocksParser();
}
