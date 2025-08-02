import { TopSkipParser, parseTopSkip, parseTopSkipFromQuery, parseTopSkipFromQueryString, topSkipToLimitParams, limitExpressionToTopSkip } from '../src/odata-parser/topSkipParser';

// Example: OData Top/Skip pagination parsing
console.log('=== OData Top/Skip Parser Usage Examples ===\n');

// 1. Basic pagination with top and skip
const parser = new TopSkipParser();

console.log('1. Basic Pagination Parameters:');
const basic1 = parser.parse({ top: 10 });
console.log('   { top: 10 } → LIMIT', basic1?.exps[0].value);

const basic2 = parser.parse({ top: 10, skip: 20 });
console.log('   { top: 10, skip: 20 } → LIMIT', basic2?.exps[0].value, 'OFFSET', basic2?.exps[1].value);

const basic3 = parser.parse({ skip: 30 });
console.log('   { skip: 30 } → Skip 30, get remaining');
console.log();

// 2. Query parameter parsing (e.g., from Express.js req.query)
console.log('2. Web Framework Integration:');
const webQuery = { $top: '25', $skip: '50' };
const webResult = parseTopSkipFromQuery(webQuery);
console.log('   Query params:', webQuery);
console.log('   Result: LIMIT', webResult?.exps[0].value, 'OFFSET', webResult?.exps[1].value);
console.log();

// 3. URL query string parsing
console.log('3. URL Query String Parsing:');
const odataUrl = '$top=15&$skip=30&$filter=status eq "active"&$orderby=name';
const urlResult = parseTopSkipFromQueryString(odataUrl);
console.log('   OData URL:', odataUrl);
console.log('   Pagination: LIMIT', urlResult?.exps[0].value, 'OFFSET', urlResult?.exps[1].value);
console.log();

// 4. Page-based pagination calculation
console.log('4. Page-based Pagination:');
function getPagePagination(pageNumber: number, pageSize: number) {
  const skip = pageNumber * pageSize;
  return { top: pageSize, skip };
}

const page2 = getPagePagination(2, 20); // Page 3 (0-indexed), 20 items per page
const pageResult = parseTopSkip(page2);
console.log(`   Page 3, 20 items/page: skip=${page2.skip}, top=${page2.top}`);
console.log('   Expression: LIMIT', pageResult?.exps[0].value, 'OFFSET', pageResult?.exps[1].value);
console.log();

// 5. DBLink integration helpers
console.log('5. DBLink Integration:');

// Convert to DBLink limit parameters
const limitParams = topSkipToLimitParams({ top: 25, skip: 75 });
console.log('   TopSkip → DBLink limit(size, index):', limitParams);

// Convert back from Expression
const expr = parseTopSkip({ top: 100, skip: 200 });
const extracted = limitExpressionToTopSkip(expr!);
console.log('   Expression → TopSkip:', extracted);
console.log();

// 6. Real-world usage patterns
console.log('6. Real-world Usage Patterns:');

// First page (no skip)
const firstPage = parseTopSkip({ top: 50 });
console.log('   First page (50 items): LIMIT', firstPage?.exps[0].value);

// Infinite scroll/cursor pagination
const nextPage = parseTopSkip({ skip: 100 });
console.log('   Continue from item 100: Skip 100, get remaining');

// Server-side pagination with limits
const serverPagination = parseTopSkip({ top: 1000, skip: 5000 });
console.log('   Large dataset pagination: LIMIT', serverPagination?.exps[0].value, 'OFFSET', serverPagination?.exps[1].value);
console.log();

console.log('=== Integration with DBLink Queries ===\n');

// Example of how this would integrate with DBLink
/*
// Hypothetical usage in a DBLink context:
const db = new TestDbContext(handler);
const queryParams = { $top: '20', $skip: '40' };

// Parse OData pagination parameters
const limitExpr = parseTopSkipFromQuery(queryParams);

if (limitExpr) {
  // Extract DBLink-compatible parameters
  const { size, index } = topSkipToLimitParams(limitExpressionToTopSkip(limitExpr));
  
  // Use with DBLink query
  const users = await db.users
    .where(u => u.eq('status', 'active'))
    .orderBy(u => [u.asc('name')])
    .limit(size, index)  // Direct integration with DBLink
    .list();
}

// Or more directly:
const topSkipParams = parseFromQuery(req.query);
const { size, index } = topSkipToLimitParams(topSkipParams);
const results = await db.users.limit(size, index).list();
*/

console.log('The OData top/skip parser creates Expression objects that integrate');
console.log("seamlessly with DBLink's existing limit(size, index) system.");
console.log('This allows OData $top/$skip parameters to be converted into');
console.log('SQL LIMIT/OFFSET clauses via the existing DBLink query builder.');

console.log('\n=== Supported OData Pagination Syntax ===');
console.log('- $top: Number of items to return (LIMIT/TAKE)');
console.log('- $skip: Number of items to skip (OFFSET)');
console.log('- Combined: $top=20&$skip=40 (Skip 40, take 20)');
console.log('- Page-based: Calculate skip from page number × page size');
console.log('- Cursor-based: Use $skip for continuation');
console.log('- Error handling: Validates non-negative integers');
console.log('- Integration: Bi-directional conversion with DBLink expressions');
