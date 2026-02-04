import { parse } from './dist/index.js';

const result = parse('/* comment content */');
console.log(JSON.stringify(result, null, 2));
