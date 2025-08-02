import { describe, it, expect } from 'vitest';
import SelectParser from '../src/odata-parser/selectParser.js';
import * as ODataParsers from '../src/odata-parser/index.js';

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

      // Parse select fields
      const selectResult = selectParser.parse('id,firstName,lastName');
      expect(selectResult.success).toBe(true);
      expect(selectResult.fields).toEqual(['id', 'firstName', 'lastName']);

      // Parse filter (basic test)
      const filterExpression = filterParser.parse("firstName eq 'John'");
      expect(filterExpression).toBeDefined();

      // Parse orderBy (basic test)
      const orderExpressions = orderByParser.parse('lastName asc');
      expect(Array.isArray(orderExpressions)).toBe(true);
    });

    it('should demonstrate complete OData query parsing workflow', () => {
      // Simulate a complete OData query
      const odataParams = {
        $select: 'id,firstName,lastName,email',
        $filter: "firstName eq 'John'",
        $orderby: 'lastName asc',
        $top: 10,
        $skip: 0
      };

      // Parse each component
      const selectParser = new ODataParsers.SelectParser();
      const filterParser = new ODataParsers.FilterParser();
      const orderByParser = new ODataParsers.OrderByParser();
      const topSkipParser = new ODataParsers.TopSkipParser();

      // Test select parsing
      const selectResult = selectParser.parse(odataParams.$select);
      expect(selectResult.success).toBe(true);
      expect(selectResult.fields).toHaveLength(4);

      // Test filter parsing
      const filterExpression = filterParser.parse(odataParams.$filter);
      expect(filterExpression).toBeDefined();

      // Test orderBy parsing
      const orderExpressions = orderByParser.parse(odataParams.$orderby);
      expect(orderExpressions).toHaveLength(1);

      // Test topSkip parsing
      const limitExpression = topSkipParser.parse({
        top: odataParams.$top,
        skip: odataParams.$skip
      });
      expect(limitExpression).toBeDefined();
    });
  });

  describe('End-to-End Usage Patterns', () => {
    it('should demonstrate typical API usage pattern', () => {
      // Mock request query parameters
      const query = {
        $select: 'id,name,email,createdAt',
        $filter: 'isActive eq true',
        $orderby: 'createdAt desc',
        $top: '20'
      };

      // Parse select - this is what we've implemented
      const selectFields = SelectParser.parseToFieldArray(query.$select);
      expect(selectFields).toEqual(['id', 'name', 'email', 'createdAt']);

      // Demonstrate how it would integrate with a mock QuerySet
      const mockQuerySet = {
        select: (fields: string[]) => ({ selectedFields: fields, applied: true }),
        where: (condition: any) => ({ whereApplied: true }),
        orderBy: (orderFunc: any) => ({ orderApplied: true }),
        limit: (size: number, offset?: number) => ({ limitApplied: true, size, offset })
      };

      // Apply select
      const withSelect = mockQuerySet.select(selectFields);
      expect(withSelect.selectedFields).toEqual(['id', 'name', 'email', 'createdAt']);
      expect(withSelect.applied).toBe(true);
    });

    it('should handle complex field selection scenarios', () => {
      // Test various realistic field selection patterns
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
        select: (fields: string[]) => ({ selectedFields: fields })
      };

      // Valid selection
      expect(() => {
        SelectParser.applySelect(mockUserQuerySet, 'id,firstName,email', userFields);
      }).not.toThrow();

      // Invalid selection
      expect(() => {
        SelectParser.applySelect(mockUserQuerySet, 'id,invalidField', userFields);
      }).toThrow('Invalid field(s) in select');

      // Partial valid selection
      const result = SelectParser.applySelect(mockUserQuerySet, 'firstName,lastName', userFields);
      expect(result.selectedFields).toEqual(['firstName', 'lastName']);
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
      // Test that error messages include position information where relevant
      const parser = new SelectParser();

      const result = parser.parse('validField,123invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
      expect(result.error).toContain('123invalid');
    });
  });
});
