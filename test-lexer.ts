import { createLexer } from './dist/lexer/lexer.js';

const lexer = createLexer();

console.log('=== Test 1: Texte simple ===');
const result1 = lexer.tokenize('hello world');
console.log('Tokens:', result1.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image,
  line: t.startLine,
  column: t.startColumn
})));

console.log('\n=== Test 2: Échappement ===');
const result2 = lexer.tokenize('\\#include file.blocks');
console.log('Tokens:', result2.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image
})));

console.log('\n=== Test 3: Code block ===');
const result3 = lexer.tokenize('``` python');
console.log('Tokens:', result3.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image
})));

console.log('\n=== Test 4: Triple colon ===');
const result4 = lexer.tokenize('::: section');
console.log('Tokens:', result4.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image
})));

console.log('\n=== Test 5: Inline code ===');
const result5 = lexer.tokenize('code:`print("hello")`');
console.log('Tokens:', result5.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image
})));

console.log('\n=== Test 6: Attributs ===');
const result6 = lexer.tokenize('[#id .class ?option]');
console.log('Tokens:', result6.tokens.map(t => ({
  type: t.tokenType.name,
  value: t.image
})));