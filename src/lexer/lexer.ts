import { Lexer } from "chevrotain";
import { allTokens } from "./tokens.js";

export class BlocksLexer {
  private lexer: Lexer;

  constructor() {
    this.lexer = new Lexer(allTokens, {
      positionTracking: "full",
      ensureOptimizations: false,
    });
  }

  tokenize(text: string) {
    const lexResult = this.lexer.tokenize(text);

    if (lexResult.errors.length > 0) {
      throw new Error(
        `Lexer errors: ${lexResult.errors.map((e) => e.message).join(", ")}`,
      );
    }

    return {
      tokens: lexResult.tokens,
      groups: lexResult.groups,
    };
  }
}

export function createLexer(): BlocksLexer {
  return new BlocksLexer();
}
