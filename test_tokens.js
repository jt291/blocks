import { createLexer } from './dist/lexer/lexer.js';

const lexer = createLexer();
const result = lexer.tokenize('/* comment content */');
console.log('Tokens:');
result.tokens.forEach(t => console.log(`  ${t.tokenType.name}: "${t.image}"`));
