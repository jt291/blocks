import { parse } from './dist/index.js';

console.log("Testing code block length mismatch:");
const result3 = parse('```\ncode\n````');
console.log("Errors:", JSON.stringify(result3.errors, null, 2));
console.log("AST:", JSON.stringify(result3.ast, null, 2));
