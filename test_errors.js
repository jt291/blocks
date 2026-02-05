import { parse } from './dist/index.js';

console.log('=== Test 1: Unclosed code block ===');
const test1 = parse('```javascript\nconst x = 1;');
console.log('Errors:', test1.errors);
console.log('AST:', JSON.stringify(test1.ast, null, 2));

console.log('\n=== Test 2: Delimiter mismatch ===');
const test2 = parse('```\ncode\n````');
console.log('Errors:', test2.errors);
console.log('AST:', JSON.stringify(test2.ast, null, 2));

console.log('\n=== Test 3: Unclosed script block ===');
const test3 = parse('!!!\nalert("test");');
console.log('Errors:', test3.errors);
console.log('AST:', JSON.stringify(test3.ast, null, 2));

console.log('\n=== Test 4: Unclosed inline code ===');
const test4 = parse('text `code without closing');
console.log('Errors:', test4.errors);
console.log('AST:', JSON.stringify(test4.ast, null, 2));
