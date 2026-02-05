import { parse } from './dist/index.js';

console.log("Testing unclosed code block:");
const result1 = parse('```javascript\nconst x = 1;\n');
console.log("Errors:", result1.errors);
console.log();

console.log("Testing unclosed script block:");
const result2 = parse('!!!\nalert("test");\n');
console.log("Errors:", result2.errors);
console.log();

console.log("Testing code block length mismatch:");
const result3 = parse('```\ncode\n````');
console.log("Errors:", result3.errors);
console.log();

console.log("Testing script block length mismatch:");
const result4 = parse('!!!\nscript\n!!!!');
console.log("Errors:", result4.errors);
console.log();

console.log("Testing unclosed inline code:");
const result5 = parse('Text with `unclosed code');
console.log("Errors:", result5.errors);
console.log();

console.log("Testing unclosed inline script:");
const result6 = parse('Text with !unclosed script');
console.log("Errors:", result6.errors);
