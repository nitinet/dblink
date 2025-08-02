// First compile the TypeScript files
// Run: npm run build

// For this example to work, we need to use the compiled JS files or run with ts-node
// Let's import from the JS files which should exist after build

// Using require for this example to avoid ES module issues
const { OrderByParser, parseOrderBy } = require('../src/odata-parser/orderByParser.js');

// Example: Basic OData orderby parsing
console.log('=== OData OrderBy Parser Usage Examples ===\n');

// 1. Simple ordering
const parser = new OrderByParser();

console.log('1. Simple field ordering:');
const simpleResult = parser.parse('name');
console.log('   Input: "name"');
console.log('   Result:', simpleResult.length, 'expressions');
console.log('   Field:', simpleResult[0].exps[0].value);
console.log('   Direction:', simpleResult[0].operator === 20 ? 'ASC' : 'DESC', '\n');

// 2. Explicit direction
console.log('2. Explicit direction:');
const explicitResult = parser.parse('name desc');
console.log('   Input: "name desc"');
console.log('   Result:', explicitResult.length, 'expressions');
console.log('   Field:', explicitResult[0].exps[0].value);
console.log('   Direction:', explicitResult[0].operator === 20 ? 'ASC' : 'DESC', '\n');

// 3. Multiple fields
console.log('3. Multiple field ordering:');
const multipleResult = parser.parse('name asc, age desc, createdAt');
console.log('   Input: "name asc, age desc, createdAt"');
console.log('   Result:', multipleResult.length, 'expressions');
multipleResult.forEach((expr, index) => {
  const direction = expr.operator === 20 ? 'ASC' : 'DESC';
  console.log(`     Field ${index + 1}: ${expr.exps[0].value} ${direction}`);
});
console.log();

// 4. Field mapping example
console.log('4. Field mapping:');
const fieldMapping = new Map([
  ['firstName', 'first_name'],
  ['lastName', 'last_name'],
  ['createdAt', 'created_at'],
  ['updatedAt', 'updated_at']
]);

const mappedResult = parseOrderBy('firstName asc, lastName desc, createdAt', fieldMapping);
console.log('   Input: "firstName asc, lastName desc, createdAt"');
console.log('   Mapping:', Object.fromEntries(fieldMapping));
console.log('   Result:', mappedResult.length, 'expressions');
mappedResult.forEach((expr, index) => {
  const direction = expr.operator === 20 ? 'ASC' : 'DESC';
  console.log(`     Field ${index + 1}: ${expr.exps[0].value} ${direction}`);
});
console.log();

// 5. Case insensitive directions
console.log('5. Case insensitive directions:');
const caseResult = parser.parse('name ASC, email DESC, phone Asc');
console.log('   Input: "name ASC, email DESC, phone Asc"');
console.log('   Result:', caseResult.length, 'expressions');
caseResult.forEach((expr, index) => {
  const direction = expr.operator === 20 ? 'ASC' : 'DESC';
  console.log(`     Field ${index + 1}: ${expr.exps[0].value} ${direction}`);
});
console.log();

// 6. Complex real-world example
console.log('6. Complex ordering:');
const complexResult = parser.parse('priority desc, category, dueDate asc, assigneeId desc');
console.log('   Input: "priority desc, category, dueDate asc, assigneeId desc"');
console.log('   Result:', complexResult.length, 'expressions');
complexResult.forEach((expr, index) => {
  const direction = expr.operator === 20 ? 'ASC' : 'DESC';
  console.log(`     Field ${index + 1}: ${expr.exps[0].value} ${direction}`);
});
console.log();

console.log('=== Integration with DBLink OrderBy ===\n');

// Example of how this would be used with dblink's orderBy system
/*
// Hypothetical usage in a dblink context:
const db = new TestDbContext(handler);
const odataOrderBy = "name asc, createdAt desc";
const expressions = parseOrderBy(odataOrderBy);

// Use the parsed expressions in an orderBy clause
const users = await db.users
  .orderBy(() => expressions)  // The Expression objects integrate seamlessly
  .list();
*/

console.log('The OData orderby parser creates Expression objects that can be used');
console.log("directly with DBLink's existing OrderExprBuilder system.");
console.log('This allows OData orderby syntax to be converted into SQL ORDER BY clauses');
console.log('that work with the existing dblink query builder.');

console.log('\n=== Supported OData OrderBy Syntax ===');
console.log('- Simple field: "name", "age", "email"');
console.log('- With direction: "name asc", "age desc"');
console.log('- Multiple fields: "name asc, age desc, email"');
console.log('- Case insensitive: "name ASC", "age DESC", "email Asc"');
console.log('- Field mapping: Maps OData field names to database column names');
console.log('- Default direction: If no direction specified, defaults to ascending');
