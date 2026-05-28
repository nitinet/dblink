import { FilterParser, parseFilter } from '../src/parsers/odata/filterParser.js';
console.log('=== OData Filter Parser Usage Examples ===\n');
const parser = new FilterParser();
const simpleFilter = "name eq 'John'";
const simpleResult = parser.parse(simpleFilter);
console.log('1. Simple filter:', simpleFilter);
console.log('   Result:', simpleResult);
console.log('   Type:', typeof simpleResult, '\n');
const complexFilter = "age gt 25 and (name eq 'John' or name eq 'Jane')";
const complexResult = parser.parse(complexFilter);
console.log('2. Complex filter:', complexFilter);
console.log('   Result:', complexResult);
console.log('   Operator:', complexResult.operator, '\n');
const stringFilter = "contains(name, 'Jo') and startswith(email, 'john')";
const stringResult = parser.parse(stringFilter);
console.log('3. String functions:', stringFilter);
console.log('   Result:', stringResult);
console.log('   Operator:', stringResult.operator, '\n');
const collectionFilter = "status in ('active', 'pending', 'approved')";
const collectionResult = parser.parse(collectionFilter);
console.log('4. Collection filter:', collectionFilter);
console.log('   Result:', collectionResult);
console.log('   Operator:', collectionResult.operator, '\n');
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
const numericFilter = 'age ge 18 and isActive eq true and score gt -10.5';
const numericResult = parser.parse(numericFilter);
console.log('6. Numeric/boolean filter:', numericFilter);
console.log('   Result:', numericResult);
console.log('   Operator:', numericResult.operator, '\n');
const nullFilter = 'description ne null and deletedAt eq null';
const nullResult = parser.parse(nullFilter);
console.log('7. Null checks:', nullFilter);
console.log('   Result:', nullResult);
console.log('   Operator:', nullResult.operator, '\n');
console.log('=== Integration with WhereExprBuilder ===\n');
console.log('The OData filter parser creates Expression objects that can be used');
console.log("directly with dblink's existing WhereExprBuilder system.");
console.log('This allows OData filter syntax to be converted into SQL expressions');
console.log('that work with the existing dblink query builder.');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2RhdGEtZmlsdGVyLXVzYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib2RhdGEtZmlsdGVyLXVzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFHakYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0FBRzVELE1BQU0sTUFBTSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7QUFDbEMsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBR25ELE1BQU0sYUFBYSxHQUFHLGtEQUFrRCxDQUFDO0FBQ3pFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRzFELE1BQU0sWUFBWSxHQUFHLG9EQUFvRCxDQUFDO0FBQzFFLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0Is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