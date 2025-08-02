import { describe, it, expect } from 'vitest';
import {
  TopSkipParser,
  parseTopSkip,
  parseTopSkipFromQuery,
  parseTopSkipFromQueryString,
  topSkipToLimitParams,
  limitExpressionToTopSkip,
  ODataTopSkipParseError
} from '../src/odata-parser/topSkipParser';
import Operator from 'dblink-core/src/sql/types/Operator.js';

describe('OData Top/Skip Parser', () => {
  describe('Basic Parsing', () => {
    it('should parse top parameter only', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({ top: 10 });

      expect(result).toBeDefined();
      expect(result!.operator).toBe(Operator.Limit);
      expect(result!.exps).toHaveLength(1);
      expect(result!.exps[0].value).toBe('10');
    });

    it('should parse skip parameter only', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({ skip: 20 });

      expect(result).toBeDefined();
      expect(result!.operator).toBe(Operator.Limit);
      expect(result!.exps).toHaveLength(2);
      expect(result!.exps[0].value).toBe(Number.MAX_SAFE_INTEGER.toString()); // Default top value
      expect(result!.exps[1].value).toBe('20');
    });

    it('should parse both top and skip parameters', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({ top: 10, skip: 20 });

      expect(result).toBeDefined();
      expect(result!.operator).toBe(Operator.Limit);
      expect(result!.exps).toHaveLength(2);
      expect(result!.exps[0].value).toBe('10'); // top
      expect(result!.exps[1].value).toBe('20'); // skip
    });

    it('should return null for empty parameters', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({});

      expect(result).toBeNull();
    });

    it('should handle top=0 (no results)', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({ top: 0 });

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('0');
    });

    it('should handle skip=0 (no offset)', () => {
      const parser = new TopSkipParser();
      const result = parser.parse({ top: 10, skip: 0 });

      expect(result).toBeDefined();
      expect(result!.exps).toHaveLength(1); // Skip=0 should not add second expression
      expect(result!.exps[0].value).toBe('10');
    });
  });

  describe('Query Parameter Parsing', () => {
    it('should parse $top from query parameters', () => {
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({ $top: '15' });

      expect(params).toEqual({ top: 15 });
    });

    it('should parse $skip from query parameters', () => {
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({ $skip: '25' });

      expect(params).toEqual({ skip: 25 });
    });

    it('should parse both $top and $skip from query parameters', () => {
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({ $top: '15', $skip: '25' });

      expect(params).toEqual({ top: 15, skip: 25 });
    });

    it('should handle numeric query parameters', () => {
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({ $top: 15, $skip: 25 });

      expect(params).toEqual({ top: 15, skip: 25 });
    });

    it('should handle empty query parameters', () => {
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({});

      expect(params).toEqual({});
    });
  });

  describe('Query String Parsing', () => {
    it('should parse $top from query string', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('$top=10');

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('10');
    });

    it('should parse $skip from query string', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('$skip=20');

      expect(result).toBeDefined();
      expect(result!.exps[1].value).toBe('20');
    });

    it('should parse both from query string', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('$top=10&$skip=20');

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('10');
      expect(result!.exps[1].value).toBe('20');
    });

    it('should handle URL encoded query string', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('%24top=10&%24skip=20');

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('10');
      expect(result!.exps[1].value).toBe('20');
    });

    it('should handle mixed parameter order', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('$skip=30&$top=5');

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('5'); // top always first
      expect(result!.exps[1].value).toBe('30'); // skip always second
    });

    it('should return null for query string without pagination parameters', () => {
      const parser = new TopSkipParser();
      const result = parser.parseFromQueryString('$filter=name eq "test"&$orderby=name');

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for negative top value', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parse({ top: -5 })).toThrow(ODataTopSkipParseError);
      expect(() => parser.parse({ top: -5 })).toThrow('Top value must be a non-negative integer');
    });

    it('should throw error for negative skip value', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parse({ skip: -10 })).toThrow(ODataTopSkipParseError);
      expect(() => parser.parse({ skip: -10 })).toThrow('Skip value must be a non-negative integer');
    });

    it('should throw error for non-integer top value', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parse({ top: 5.5 })).toThrow(ODataTopSkipParseError);
    });

    it('should throw error for non-integer skip value', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parse({ skip: 10.7 })).toThrow(ODataTopSkipParseError);
    });

    it('should throw error for invalid $top in query parameters', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parseFromQuery({ $top: 'invalid' })).toThrow(ODataTopSkipParseError);
      expect(() => parser.parseFromQuery({ $top: 'invalid' })).toThrow('Top parameter must be a valid integer');
    });

    it('should throw error for invalid $skip in query parameters', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parseFromQuery({ $skip: 'invalid' })).toThrow(ODataTopSkipParseError);
      expect(() => parser.parseFromQuery({ $skip: 'invalid' })).toThrow('Skip parameter must be a valid integer');
    });

    it('should include parameter name in error message', () => {
      const parser = new TopSkipParser();

      expect(() => parser.parseFromQuery({ $top: 'abc' })).toThrow("for parameter '$top'");
      expect(() => parser.parseFromQuery({ $skip: 'xyz' })).toThrow("for parameter '$skip'");
    });
  });

  describe('Utility Functions', () => {
    it('should work with parseTopSkip utility function', () => {
      const result = parseTopSkip({ top: 15, skip: 25 });

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('15');
      expect(result!.exps[1].value).toBe('25');
    });

    it('should work with parseTopSkipFromQuery utility function', () => {
      const result = parseTopSkipFromQuery({ $top: '20', $skip: '10' });

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('20');
      expect(result!.exps[1].value).toBe('10');
    });

    it('should work with parseTopSkipFromQueryString utility function', () => {
      const result = parseTopSkipFromQueryString('$top=5&$skip=15');

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('5');
      expect(result!.exps[1].value).toBe('15');
    });
  });

  describe('DBLink Integration Helpers', () => {
    it('should convert top/skip to limit parameters', () => {
      const limitParams = topSkipToLimitParams({ top: 10, skip: 20 });

      expect(limitParams).toEqual({ size: 10, index: 20 });
    });

    it('should convert top only to limit parameters', () => {
      const limitParams = topSkipToLimitParams({ top: 15 });

      expect(limitParams).toEqual({ size: 15 });
    });

    it('should convert skip only to limit parameters', () => {
      const limitParams = topSkipToLimitParams({ skip: 30 });

      expect(limitParams).toEqual({ index: 30 });
    });

    it('should handle empty parameters for limit conversion', () => {
      const limitParams = topSkipToLimitParams({});

      expect(limitParams).toEqual({});
    });

    it('should extract top/skip from limit expression', () => {
      const expr = parseTopSkip({ top: 10, skip: 20 });
      const extracted = limitExpressionToTopSkip(expr!);

      expect(extracted).toEqual({ top: 10, skip: 20 });
    });

    it('should extract top only from limit expression', () => {
      const expr = parseTopSkip({ top: 15 });
      const extracted = limitExpressionToTopSkip(expr!);

      expect(extracted).toEqual({ top: 15 });
    });

    it('should handle skip-only expression (with MAX_SAFE_INTEGER top)', () => {
      const expr = parseTopSkip({ skip: 25 });
      const extracted = limitExpressionToTopSkip(expr!);

      expect(extracted).toEqual({ skip: 25 }); // Should not include the large default top value
    });
  });

  describe('Real-world Examples', () => {
    it('should handle typical pagination scenario', () => {
      // Page 3 of 10 items per page: skip 20, take 10
      const result = parseTopSkip({ top: 10, skip: 20 });

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('10');
      expect(result!.exps[1].value).toBe('20');
    });

    it('should handle first page with top only', () => {
      // First page: take 25 items
      const result = parseTopSkip({ top: 25 });

      expect(result).toBeDefined();
      expect(result!.exps).toHaveLength(1);
      expect(result!.exps[0].value).toBe('25');
    });

    it('should handle skip without top for streaming/cursor scenarios', () => {
      // Skip first 100 items, get remaining (for large datasets)
      const result = parseTopSkip({ skip: 100 });

      expect(result).toBeDefined();
      expect(result!.exps).toHaveLength(2);
      expect(result!.exps[0].value).toBe(Number.MAX_SAFE_INTEGER.toString());
      expect(result!.exps[1].value).toBe('100');
    });

    it('should parse from actual OData query string', () => {
      const odataQuery = '$filter=status eq "active"&$top=20&$skip=40&$orderby=name asc';
      const result = parseTopSkipFromQueryString(odataQuery);

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('20');
      expect(result!.exps[1].value).toBe('40');
    });

    it('should work with web framework query objects', () => {
      // Simulating Express.js req.query or similar
      const webQuery = { $top: '15', $skip: '30', $filter: 'name eq "test"' };
      const result = parseTopSkipFromQuery(webQuery);

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe('15');
      expect(result!.exps[1].value).toBe('30');
    });
  });

  describe('Expression Structure Validation', () => {
    it('should create proper Expression structure with correct operator', () => {
      const result = parseTopSkip({ top: 10, skip: 20 });

      expect(result).toBeDefined();
      expect(result!.operator).toBe(Operator.Limit);
      expect(result!.exps).toHaveLength(2);
      expect(result!.exps[0].operator).toBeNull(); // Value expressions have null operators
      expect(result!.exps[1].operator).toBeNull();
    });

    it('should create expressions compatible with DBLink limit system', () => {
      // This tests that our expressions match the structure created by DBLink's limit method
      const result = parseTopSkip({ top: 5, skip: 10 });

      expect(result).toBeDefined();
      expect(result!.operator).toBe(Operator.Limit);
      expect(result!.exps[0].value).toBe('5'); // size parameter
      expect(result!.exps[1].value).toBe('10'); // index parameter

      // Verify no additional properties that might break DBLink integration
      expect(result!.args).toEqual([]);
      expect(result!.value).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers within JavaScript limits', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER - 1;
      const result = parseTopSkip({ top: largeNumber });

      expect(result).toBeDefined();
      expect(result!.exps[0].value).toBe(largeNumber.toString());
    });

    it('should handle zero values correctly', () => {
      const result = parseTopSkip({ top: 0, skip: 0 });

      expect(result).toBeDefined();
      expect(result!.exps).toHaveLength(1); // skip=0 should not add second expression
      expect(result!.exps[0].value).toBe('0');
    });

    it('should preserve parameter precedence in complex scenarios', () => {
      // Ensure top/skip from different sources are handled correctly
      const parser = new TopSkipParser();
      const params = parser.parseFromQuery({ $top: '10', $skip: '20' });
      const result = parser.parse(params);

      expect(result!.exps[0].value).toBe('10');
      expect(result!.exps[1].value).toBe('20');
    });
  });
});
