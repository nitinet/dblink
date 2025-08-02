import { FilterParser, parseFilter } from '../src/odata-parser/filterParser';

// Example: Basic OData filter parsing
console.log('=== OData Filter Parser Usage Examples ===\n');

// 1. Simple comparison
const parser = new FilterParser();
const simpleFilter = "name eq 'John'";
const simpleResult = parser.parse(simpleFilter);
console.log('1. Simple filter:', simpleFilter);
console.log('   Result:', simpleResult);
console.log('   Type:', typeof simpleResult, '\n');

// 2. Complex filter with multiple conditions
const complexFilter = "age gt 25 and (name eq 'John' or name eq 'Jane')";
const complexResult = parser.parse(complexFilter);
console.log('2. Complex filter:', complexFilter);
console.log('   Result:', complexResult);
console.log('   Operator:', complexResult.operator, '\n');

// 3. String functions
const stringFilter = "contains(name, 'Jo') and startswith(email, 'john')";
const stringResult = parser.parse(stringFilter);
console.log('3. String functions:', stringFilter);
console.log('   Result:', stringResult);
console.log('   Operator:', stringResult.operator, '\n');

// 4. Collection filter (IN operator)
const collectionFilter = "status in ('active', 'pending', 'approved')";
const collectionResult = parser.parse(collectionFilter);
console.log('4. Collection filter:', collectionFilter);
console.log('   Result:', collectionResult);
console.log('   Operator:', collectionResult.operator, '\n');

// 5. Field mapping example
const fieldMapping = new Map([
  ['firstName', 'first_name'],
  ['lastName', 'last_name'],
  ['emailAddress', 'email']
]);

const mappedFilter = "firstName eq 'John' and emailAddress eq 'john@example.com'";
const mappedResult = parseFilter(mappedFilter, fieldMapping);
console.log('5. Field mapping:', mappedFilter);
console.log('   With mapping:', Object.fromEntries(fieldMapping));
console.log('   Result:', mappedResult);
console.log('   Operator:', mappedResult.operator, '\n');

// 6. Numeric and boolean filters
const numericFilter = 'age ge 18 and isActive eq true and score gt -10.5';
const numericResult = parser.parse(numericFilter);
console.log('6. Numeric/boolean filter:', numericFilter);
console.log('   Result:', numericResult);
console.log('   Operator:', numericResult.operator, '\n');

// 7. Null checks
const nullFilter = 'description ne null and deletedAt eq null';
const nullResult = parser.parse(nullFilter);
console.log('7. Null checks:', nullFilter);
console.log('   Result:', nullResult);
console.log('   Operator:', nullResult.operator, '\n');

console.log('=== Integration with WhereExprBuilder ===\n');

// Example of how this would be used with dblink's WhereExprBuilder
// This shows the Expression objects can be used in existing dblink queries

/*
// Hypothetical usage in a dblink context:
const db = new TestDbContext(handler);
const odataFilter = "age gt 25 and name eq 'John'";
const expression = parseFilter(odataFilter);

// Use the parsed expression in a where clause
const users = await db.users
  .where(() => expression)  // The Expression object integrates seamlessly
  .list();
*/

console.log('The OData filter parser creates Expression objects that can be used');
console.log("directly with dblink's existing WhereExprBuilder system.");
console.log('This allows OData filter syntax to be converted into SQL expressions');
console.log('that work with the existing dblink query builder.');
