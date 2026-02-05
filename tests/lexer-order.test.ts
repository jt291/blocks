import { describe, it, expect } from 'vitest';
import { BlocksLexer } from '../src/lexer/lexer';

describe('Lexer token matching order', () => {
  it('should match ::: as BlockGenericDelim not InlineGenericDelim', () => {
    const lexer = new BlocksLexer();
    const result = lexer.tokenize(':::');
    
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('BlockGenericDelim');
    expect(result.tokens[0].image).toBe(':::');
  });

  it('should match : as InlineGenericDelim', () => {
    const lexer = new BlocksLexer();
    const result = lexer.tokenize(':');
    
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('InlineGenericDelim');
    expect(result.tokens[0].image).toBe(':');
  });

  it('should match ::::#outer correctly', () => {
    const lexer = new BlocksLexer();
    const result = lexer.tokenize('::::#outer');
    
    console.log('Tokens:', result.tokens.map(t => ({ type: t.tokenType.name, image: t.image })));
    
    expect(result.tokens[0].tokenType.name).toBe('BlockGenericDelim');
    expect(result.tokens[0].image).toBe('::::');
  });

  it('should match !!! as BlockScriptDelim not InlineScriptDelim', () => {
    const lexer = new BlocksLexer();
    const result = lexer.tokenize('!!!');
    
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('BlockScriptDelim');
    expect(result.tokens[0].image).toBe('!!!');
  });

  it('should match ``` as BlockCodeDelim not InlineCodeDelim', () => {
    const lexer = new BlocksLexer();
    const result = lexer.tokenize('```');
    
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('BlockCodeDelim');
    expect(result.tokens[0].image).toBe('```');
  });
});
