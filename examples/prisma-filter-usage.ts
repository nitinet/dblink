/*
 * Prisma Filter Parser Usage Example
 *
 * This example demonstrates how to use the Prisma filter parser to convert
 * Prisma-style filter objects into DBLink Expression objects.
 */

import { PrismaFilterParser, parsePrismaFilter } from '../src/parsers/prisma/index.js';

console.log('=== Prisma Filter Parser Usage Examples ===\n');

// 1. Simple equality (shorthand)
const parser = new PrismaFilterParser();
const simpleFilter = { name: 'John' };
const simpleResult = parser.parse(simpleFilter);
console.log('1. Simple filter (shorthand):', JSON.stringify(simpleFilter));
console.log('   Result:', simpleResult);
console.log('   Type:', typeof simpleResult, '\n');

// 2. Explicit equals operator
const explicitFilter = { name: { equals: 'John' } };
const explicitResult = parser.parse(explicitFilter);
console.log('2. Explicit equals:', JSON.stringify(explicitFilter));
console.log('   Result:', explicitResult);
console.log('   Operator:', explicitResult.operator, '\n');

// 3. Comparison operators
const comparisonFilter = { age: { gt: 25, lte: 65 } };
const comparisonResult = parser.parse(comparisonFilter);
console.log('3. Comparison operators:', JSON.stringify(comparisonFilter));
console.log('   Result:', comparisonResult);
console.log('   Operator:', comparisonResult.operator, '\n');

// 4. String operations
const stringFilter = { email: { contains: '@example.com' } };
const stringResult = parser.parse(stringFilter);
console.log('4. String operations:', JSON.stringify(stringFilter));
console.log('   Result:', stringResult);
console.log('   Operator:', stringResult.operator, '\n');

// 5. IN operator
const inFilter = { status: { in: ['active', 'pending', 'approved'] } };
const inResult = parser.parse(inFilter);
console.log('5. IN operator:', JSON.stringify(inFilter));
console.log('   Result:', inResult);
console.log('   Operator:', inResult.operator, '\n');

// 6. AND logical operator
const andFilter = {
  AND: [{ name: 'John' }, { age: { gt: 25 } }, { active: true }]
};
const andResult = parser.parse(andFilter);
console.log('6. AND operator:', JSON.stringify(andFilter));
console.log('   Result:', andResult);
console.log('   Operator:', andResult.operator, '\n');

// 7. OR logical operator
const orFilter = {
  OR: [{ name: 'John' }, { name: 'Jane' }]
};
const orResult = parser.parse(orFilter);
console.log('7. OR operator:', JSON.stringify(orFilter));
console.log('   Result:', orResult);
console.log('   Operator:', orResult.operator, '\n');

// 8. NOT logical operator
const notFilter = {
  NOT: { status: 'banned' }
};
const notResult = parser.parse(notFilter);
console.log('8. NOT operator:', JSON.stringify(notFilter));
console.log('   Result:', notResult);
console.log('   Operator:', notResult.operator, '\n');

// 9. Complex nested filter
const complexFilter = {
  AND: [{ OR: [{ name: { contains: 'Smith' } }, { email: { endsWith: '@example.com' } }] }, { age: { gte: 18, lte: 65 } }, { NOT: { status: 'suspended' } }]
};
const complexResult = parser.parse(complexFilter);
console.log('9. Complex nested filter:', JSON.stringify(complexFilter));
console.log('   Result:', complexResult);
console.log('   Operator:', complexResult.operator, '\n');

// 10. Field mapping example
const fieldMapping = new Map([
  ['firstName', 'first_name'],
  ['lastName', 'last_name'],
  ['emailAddress', 'email']
]);

const mappedFilter = {
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: { contains: '@example.com' }
};
const mappedResult = parsePrismaFilter(mappedFilter, { fieldColumnMap: fieldMapping });
console.log('10. Field mapping:', JSON.stringify(mappedFilter));
console.log('    With mapping:', Object.fromEntries(fieldMapping));
console.log('    Result:', mappedResult);
console.log('    Operator:', mappedResult.operator, '\n');

// 11. Null checks
const nullFilter = {
  AND: [{ email: { not: null } }, { deletedAt: null }]
};
const nullResult = parser.parse(nullFilter);
console.log('11. Null checks:', JSON.stringify(nullFilter));
console.log('    Result:', nullResult);
console.log('    Operator:', nullResult.operator, '\n');

console.log('=== Integration with DBLink ===\n');

// Example of how this would be used with dblink's query builder
// This shows the Expression objects can be used in existing dblink queries

/*
// Hypothetical usage in a dblink context:
const db = new TestDbContext(handler);

// Prisma-style filter
const prismaWhere = {
  AND: [
    { age: { gt: 25 } },
    { name: { contains: 'John' } },
    { active: true }
  ]
};

// Parse the Prisma filter
const expression = parsePrismaFilter(prismaWhere);

// Use the parsed expression in a where clause
const users = await db.users
  .where(() => expression)  // The Expression object integrates seamlessly
  .list();
*/

console.log('The Prisma filter parser creates Expression objects that can be used');
console.log("directly with DBLink's existing WhereExprBuilder system.");
console.log('This allows Prisma-style filter objects to be converted into SQL expressions');
console.log('that work with the existing dblink query builder.');

console.log('\n=== Supported Prisma Filter Syntax ===');
console.log('✓ Comparison: equals, not, gt, gte, lt, lte');
console.log('✓ String: contains, startsWith, endsWith');
console.log('✓ Collection: in, notIn');
console.log('✓ Logical: AND, OR, NOT');
console.log('✓ Null checks: null values, not null');
console.log('✓ Shorthand: Direct value assignment (e.g., { name: "John" })');
console.log('✓ Field mapping: Maps entity field names to database column names');
console.log('✓ Complex nesting: Multiple levels of logical operators');

console.log('\n=== Prisma vs OData Comparison ===');
console.log('Prisma:  { name: { contains: "John" }, age: { gt: 25 } }');
console.log('OData:   name contains "John" and age gt 25');
console.log('Both parse to the same DBLink Expression structure!');
