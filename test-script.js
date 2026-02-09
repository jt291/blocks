import { process } from "./dist/index.js";

// Test 1 : Simple arithmetic
console.log("Test 1: Simple arithmetic");
const result1 = process("Result: ${2 + 2}");
console.log("Input: Result: ${2 + 2}");
console.log("Output:", result1.output);
console.log("Expected: Result: 4");
console.log("---\n");

// Test 2 : Variables
console.log("Test 2: Variables");
const result2 = process("Total: ${price * quantity}", {
  variables: { price: 10, quantity: 5 }
});
console.log("Input: Total: ${price * quantity}");
console.log("Context: { price: 10, quantity: 5 }");
console.log("Output:", result2.output);
console.log("Expected: Total: 50");
console.log("---\n");

// Test 3 : Property access
console.log("Test 3: Property access");
const result3 = process("Name: ${user.name}", {
  variables: { user: { name: "Alice" } }
});
console.log("Input: Name: ${user.name}");
console.log("Context: { user: { name: 'Alice' } }");
console.log("Output:", result3.output);
console.log("Expected: Name: Alice");
console.log("---\n");

// Test 4 : Multiple expressions
console.log("Test 4: Multiple expressions");
const result4 = process("${a} + ${b} = ${a + b}", {
  variables: { a: 3, b: 7 }
});
console.log("Input: ${a} + ${b} = ${a + b}");
console.log("Context: { a: 3, b: 7 }");
console.log("Output:", result4.output);
console.log("Expected: 3 + 7 = 10");
console.log("---\n");

// Test 5 : Complex expression
console.log("Test 5: Complex expression");
const result5 = process("Price: $${price}, Tax: $${price * 0.2}, Total: $${price * 1.2}", {
  variables: { price: 100 }
});
console.log("Input: Price: ${price}, Tax: ${price * 0.2}, Total: ${price * 1.2}");
console.log("Context: { price: 100 }");
console.log("Output:", result5.output);
console.log("Expected: Price: 100, Tax: 20, Total: 120");
console.log("---\n");

// Test 6 : In blocks
console.log("Test 6: In blocks");
const result6 = process(`:::invoice
Customer: \${customer.name}
Total: $\${price * qty}
:::`, {
  variables: {
    customer: { name: "Bob" },
    price: 50,
    qty: 2
  }
});
console.log("Input: :::invoice\\nCustomer: ${customer.name}\\nTotal: ${price * qty}\\n:::");
console.log("Context: { customer: { name: 'Bob' }, price: 50, qty: 2 }");
console.log("Output:", result6.output);
console.log("Expected: Customer: Bob, Total: 100");