import { parse } from './dist/index.js';

const result = parse('::: div { #id } content :::');
console.log(JSON.stringify(result, null, 2));
