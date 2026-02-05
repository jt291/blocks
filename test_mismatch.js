import { parse } from './dist/index.js';

// This should trigger our custom length mismatch error
console.log("Testing code block length mismatch (3 vs 4):");
const result1 = parse('```\ncode\n````');
console.log("Errors:", result1.errors);
console.log();

// This should work fine (matching lengths)
console.log("Testing code block with matching lengths:");
const result2 = parse('```\ncode\n```');
console.log("Errors:", result2.errors);
console.log("Success:", result2.errors.length === 0);
console.log();

// Test script mismatch
console.log("Testing script block length mismatch (3 vs 4):");
const result3 = parse('!!!\nscript\n!!!!');
console.log("Errors:", result3.errors);
