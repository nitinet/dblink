import { describe, it, expect } from 'vitest';
import SelectParser from '../src/parsers/odata/selectParser.js';
import * as ODataParsers from '../src/parsers/odata/index.js';
describe('OData Select Parser Integration', () => {
    describe('Module Exports', () => {
        it('should export SelectParser from index', () => {
            expect(ODataParsers.SelectParser).toBeDefined();
            expect(typeof ODataParsers.SelectParser).toBe('function');
        });
        it('should create SelectParser instance', () => {
            const parser = new ODataParsers.SelectParser();
            expect(parser).toBeDefined();
            expect(typeof parser.parse).toBe('function');
        });
        it('should export all expected parsers', () => {
            expect(ODataParsers.FilterParser).toBeDefined();
            expect(ODataParsers.OrderByParser).toBeDefined();
            expect(ODataParsers.SelectParser).toBeDefined();
            expect(ODataParsers.TopSkipParser).toBeDefined();
        });
    });
    describe('Cross-Parser Compatibility', () => {
        it('should work alongside other OData parsers', () => {
            const selectParser = new ODataParsers.SelectParser();
            const filterParser = new ODataParsers.FilterParser();
            const orderByParser = new ODataParsers.OrderByParser();
            const selectResult = selectParser.parse('id,firstName,lastName');
            expect(selectResult.success).toBe(true);
            expect(selectResult.fields).toEqual(['id', 'firstName', 'lastName']);
            const filterExpression = filterParser.parse("firstName eq 'John'");
            expect(filterExpression).toBeDefined();
            const orderExpressions = orderByParser.parse('lastName asc');
            expect(Array.isArray(orderExpressions)).toBe(true);
        });
        it('should demonstrate complete OData query parsing workflow', () => {
            const odataParams = {
                $select: 'id,firstName,lastName,email',
                $filter: "firstName eq 'John'",
                $orderby: 'lastName asc',
                $top: 10,
                $skip: 0
            };
            const selectParser = new ODataParsers.SelectParser();
            const filterParser = new ODataParsers.FilterParser();
            const orderByParser = new ODataParsers.OrderByParser();
            const topSkipParser = new ODataParsers.TopSkipParser();
            const selectResult = selectParser.parse(odataParams.$select);
            expect(selectResult.success).toBe(true);
            expect(selectResult.fields).toHaveLength(4);
            const filterExpression = filterParser.parse(odataParams.$filter);
            expect(filterExpression).toBeDefined();
            const orderExpressions = orderByParser.parse(odataParams.$orderby);
            expect(orderExpressions).toHaveLength(1);
            const limitExpression = topSkipParser.parse({
                top: odataParams.$top,
                skip: odataParams.$skip
            });
            expect(limitExpression).toBeDefined();
        });
    });
    describe('End-to-End Usage Patterns', () => {
        it('should demonstrate typical API usage pattern', () => {
            const query = {
                $select: 'id,name,email,createdAt',
                $filter: 'isActive eq true',
                $orderby: 'createdAt desc',
                $top: '20'
            };
            const selectFields = SelectParser.parseToFieldArray(query.$select);
            expect(selectFields).toEqual(['id', 'name', 'email', 'createdAt']);
            const mockQuerySet = {
                select: (fields) => ({ selectedFields: fields, applied: true }),
                where: (condition) => ({ whereApplied: true }),
                orderBy: (orderFunc) => ({ orderApplied: true }),
                limit: (size, offset) => ({ limitApplied: true, size, offset })
            };
            const withSelect = mockQuerySet.select(selectFields);
            expect(withSelect.selectedFields).toEqual(['id', 'name', 'email', 'createdAt']);
            expect(withSelect.applied).toBe(true);
        });
        it('should handle complex field selection scenarios', () => {
            const scenarios = [
                {
                    query: 'id,firstName,lastName',
                    expected: ['id', 'firstName', 'lastName'],
                    description: 'Basic user fields'
                },
                {
                    query: 'id,name,description,createdAt,updatedAt,isActive',
                    expected: ['id', 'name', 'description', 'createdAt', 'updatedAt', 'isActive'],
                    description: 'Common entity fields'
                },
                {
                    query: 'order.id,order.total,customer.name,customer.email',
                    expected: ['order.id', 'order.total', 'customer.name', 'customer.email'],
                    description: 'Relationship fields'
                },
                {
                    query: 'id, name , email,  phone',
                    expected: ['id', 'name', 'email', 'phone'],
                    description: 'Fields with varying whitespace'
                }
            ];
            scenarios.forEach(scenario => {
                const result = SelectParser.parseToFieldArray(scenario.query);
                expect(result).toEqual(scenario.expected);
            });
        });
        it('should validate field selection with available fields', () => {
            const userFields = ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt', 'updatedAt'];
            const mockUserQuerySet = {
                select: (fields) => ({ selectedFields: fields })
            };
            expect(() => {
                SelectParser.applySelect(mockUserQuerySet, 'id,firstName,email', userFields);
            }).not.toThrow();
            expect(() => {
                SelectParser.applySelect(mockUserQuerySet, 'id,invalidField', userFields);
            }).toThrow('Invalid field(s) in select');
        });
    });
    describe('Error Scenarios', () => {
        it('should handle various error conditions gracefully', () => {
            const errorCases = [
                { input: '', error: 'Query must be a non-empty string' },
                { input: '  ', error: 'No fields specified in select query' },
                { input: 'field1,', error: 'Unexpected end of query after comma' },
                { input: ',field1', error: 'Expected field name' },
                { input: 'field1,,field2', error: 'Expected field name' },
                { input: '123invalid', error: 'Invalid field name' },
                { input: 'field@name', error: 'Invalid field name' },
                { input: 'field1,field1', error: 'Duplicate field' }
            ];
            errorCases.forEach(testCase => {
                const parser = new SelectParser();
                const result = parser.parse(testCase.input);
                expect(result.success).toBe(false);
                expect(result.error).toContain(testCase.error);
            });
        });
        it('should provide helpful error messages', () => {
            const parser = new SelectParser();
            const result = parser.parse('validField,123invalid');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid field name');
            expect(result.error).toContain('123invalid');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2RhdGEtc2VsZWN0LWludGVncmF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvZGF0YS1zZWxlY3QtaW50ZWdyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDOUMsT0FBTyxZQUFZLE1BQU0sc0NBQXNDLENBQUM7QUFDaEUsT0FBTyxLQUFLLFlBQVksTUFBTSwrQkFBK0IsQ0FBQztBQUU5RCxRQUFRLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO0lBQy9DLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxPQUFPLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxF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