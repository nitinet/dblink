import { parseFilter } from '../src/parsers/odata/filterParser.js';
import { parseOrderBy } from '../src/parsers/odata/orderByParser.js';
import { parseTopSkipFromQuery, topSkipToLimitParams } from '../src/parsers/odata/topSkipParser.js';
async function processODataQuery(req, db) {
    const query = req.query;
    console.log('=== Complete OData Query Processing ===');
    console.log('Query parameters:', query);
    console.log();
    let whereExpression;
    if (query.$filter) {
        console.log('🔍 Processing $filter:', query.$filter);
        whereExpression = parseFilter(query.$filter);
        console.log('   → WHERE expression created');
    }
    let orderExpressions;
    if (query.$orderby) {
        console.log('📊 Processing $orderby:', query.$orderby);
        orderExpressions = parseOrderBy(query.$orderby);
        console.log('   → ORDER BY expressions created:', orderExpressions.length);
    }
    let limitParams;
    if (query.$top || query.$skip) {
        console.log('📄 Processing pagination: $top=' + query.$top + ', $skip=' + query.$skip);
        const topSkipExpr = parseTopSkipFromQuery(query);
        if (topSkipExpr) {
            limitParams = topSkipToLimitParams({ top: query.$top ? parseInt(query.$top) : undefined, skip: query.$skip ? parseInt(query.$skip) : undefined });
            console.log('   → LIMIT/OFFSET parameters:', limitParams);
        }
    }
    console.log();
    console.log('🔧 Building DBLink query...');
    let dbQuery = db.users;
    if (whereExpression) {
        dbQuery = dbQuery.where(() => whereExpression);
        console.log('   ✅ WHERE clause applied');
    }
    if (orderExpressions) {
        dbQuery = dbQuery.orderBy(() => orderExpressions);
        console.log('   ✅ ORDER BY clause applied');
    }
    if (limitParams) {
        const { size, index } = limitParams;
        dbQuery = dbQuery.limit(size, index);
        console.log('   ✅ LIMIT/OFFSET applied');
    }
    console.log();
    console.log('🚀 Executing query...');
    console.log('✅ Complete OData query processed successfully!');
    return dbQuery;
}
console.log('=== OData Integration Examples ===\n');
console.log('1. Filter + Pagination:');
const example1 = {
    query: {
        $filter: "status eq 'active'",
        $top: '20',
        $skip: '40'
    }
};
console.log("   OData: GET /users?$filter=status eq 'active'&$top=20&$skip=40");
console.log('   → WHERE status = "active" LIMIT 20 OFFSET 40\n');
console.log('2. Complete Query:');
const example2 = {
    query: {
        $filter: "age gt 25 and status eq 'active'",
        $orderby: 'lastName asc, firstName asc',
        $top: '10',
        $skip: '20'
    }
};
console.log("   OData: GET /users?$filter=age gt 25 and status eq 'active'&$orderby=lastName asc, firstName asc&$top=10&$skip=20");
console.log('   → WHERE age > 25 AND status = "active" ORDER BY lastName ASC, firstName ASC LIMIT 10 OFFSET 20\n');
console.log('3. Ordering Only:');
const example3 = {
    query: {
        $orderby: 'createdAt desc, id asc'
    }
};
console.log('   OData: GET /users?$orderby=createdAt desc, id asc');
console.log('   → ORDER BY createdAt DESC, id ASC\n');
console.log('4. Field Mapping Support:');
const fieldMapping = new Map([
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['createdAt', 'created_at']
]);
console.log('   Field mapping: firstName→first_name, lastName→last_name, createdAt→created_at');
console.log("   OData: $filter=firstName eq 'John'&$orderby=lastName asc");
console.log('   → WHERE first_name = "John" ORDER BY last_name ASC\n');
console.log('=== Integration Benefits ===');
console.log('✅ Complete OData v4 query parameter support');
console.log('✅ Seamless integration with existing DBLink query builder');
console.log('✅ Type-safe expression building');
console.log('✅ Field mapping for database column names');
console.log('✅ Comprehensive error handling and validation');
console.log('✅ Support for complex filtering, sorting, and pagination');
console.log('✅ Web framework agnostic (Express, Fastify, etc.)');
console.log('\n=== Supported OData Features ===');
console.log('📋 $filter: eq, ne, gt, ge, lt, le, and, or, not, contains, startswith, endswith');
console.log('📊 $orderby: field asc/desc, multiple fields, case-insensitive directions');
console.log('📄 $top/$skip: pagination with LIMIT/OFFSET, page-based and cursor-based');
console.log('🔗 Integration: Works with DBLink Expression system and query builder');
console.log('🛡️ Validation: Parameter validation, type checking, error handling');
console.log('🗺️ Mapping: Field name mapping to database column names');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2RhdGEtY29tcGxldGUtaW50ZWdyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvZGF0YS1jb21wbGV0ZS1pbnRlZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFPQSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFDbkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQ3JFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBR3BHLEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxHQUFRLEVBQUUsRUFBTztJQUNoRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUdkLElBQUksZUFBZSxDQUFDO0lBQ3BCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBR0QsSUFBSSxnQkFBZ0IsQ0FBQztJQUNyQixJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sQ0FB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