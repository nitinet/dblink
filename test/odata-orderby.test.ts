import { beforeEach, describe, expect, it } from 'vitest';
import { OrderByParser, ODataOrderByParseError, parseOrderBy } from '../src/odata-parser/orderByParser.js';

describe('OData OrderBy Parser', () => {
  let parser: OrderByParser;

  beforeEach(() => {
    // Create a parser with sample field mappings
    const fieldMap = new Map([
      ['name', 'user_name'],
      ['age', 'user_age'],
      ['email', 'email_address'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at']
    ]);
    parser = new OrderByParser(fieldMap);
  });

  describe('Basic Parsing', () => {
    it('should parse empty orderby', () => {
      const result = parser.parse('');
      expect(result).toEqual([]);
    });

    it('should parse single field without direction (defaults to asc)', () => {
      const result = parser.parse('name');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0].operator).toBe(20); // Operator.Asc
    });

    it('should parse single field with asc direction', () => {
      const result = parser.parse('name asc');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0].operator).toBe(20); // Operator.Asc
    });

    it('should parse single field with desc direction', () => {
      const result = parser.parse('name desc');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0].operator).toBe(21); // Operator.Desc
    });
  });

  describe('Multiple Field Ordering', () => {
    it('should parse multiple fields with mixed directions', () => {
      const result = parser.parse('name asc, age desc');
      expect(result).toHaveLength(2);

      expect(result[0].operator).toBe(20); // Operator.Asc for name
      expect(result[1].operator).toBe(21); // Operator.Desc for age
    });

    it('should parse multiple fields with some default directions', () => {
      const result = parser.parse('name, age desc, email');
      expect(result).toHaveLength(3);

      expect(result[0].operator).toBe(20); // Operator.Asc for name (default)
      expect(result[1].operator).toBe(21); // Operator.Desc for age
      expect(result[2].operator).toBe(20); // Operator.Asc for email (default)
    });

    it('should parse complex multi-field ordering', () => {
      const result = parser.parse('createdAt desc, name asc, age desc, email');
      expect(result).toHaveLength(4);

      expect(result[0].operator).toBe(21); // Operator.Desc for createdAt
      expect(result[1].operator).toBe(20); // Operator.Asc for name
      expect(result[2].operator).toBe(21); // Operator.Desc for age
      expect(result[3].operator).toBe(20); // Operator.Asc for email (default)
    });
  });

  describe('Field Mapping', () => {
    it('should map field names to column names', () => {
      const result = parser.parse('name asc');
      expect(result).toHaveLength(1);

      // The field should be mapped from 'name' to 'user_name'
      expect(result[0].exps[0].value).toBe('user_name');
    });

    it('should handle unmapped field names', () => {
      const result = parser.parse('unmappedField desc');
      expect(result).toHaveLength(1);

      // Should use the field name as-is when no mapping exists
      expect(result[0].exps[0].value).toBe('unmappedField');
    });

    it('should apply mapping to multiple fields', () => {
      const result = parser.parse('name asc, email desc, unmappedField');
      expect(result).toHaveLength(3);

      expect(result[0].exps[0].value).toBe('user_name'); // mapped
      expect(result[1].exps[0].value).toBe('email_address'); // mapped
      expect(result[2].exps[0].value).toBe('unmappedField'); // not mapped
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle extra whitespace', () => {
      const result = parser.parse('  name   asc  ,  age   desc  ');
      expect(result).toHaveLength(2);

      expect(result[0].operator).toBe(20); // Operator.Asc
      expect(result[1].operator).toBe(21); // Operator.Desc
    });

    it('should handle minimal whitespace', () => {
      const result = parser.parse('name asc,age desc');
      expect(result).toHaveLength(2);

      expect(result[0].operator).toBe(20); // Operator.Asc
      expect(result[1].operator).toBe(21); // Operator.Desc
    });

    it('should handle no whitespace around commas', () => {
      const result = parser.parse('name,age,email');
      expect(result).toHaveLength(3);

      // All should default to ascending
      expect(result[0].operator).toBe(20);
      expect(result[1].operator).toBe(20);
      expect(result[2].operator).toBe(20);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle uppercase directions', () => {
      const result = parser.parse('name ASC, age DESC');
      expect(result).toHaveLength(2);

      expect(result[0].operator).toBe(20); // Operator.Asc
      expect(result[1].operator).toBe(21); // Operator.Desc
    });

    it('should handle mixed case directions', () => {
      const result = parser.parse('name Asc, age DesC');
      expect(result).toHaveLength(2);

      expect(result[0].operator).toBe(20); // Operator.Asc
      expect(result[1].operator).toBe(21); // Operator.Desc
    });

    it('should preserve field name case', () => {
      const result = parser.parse('FirstName asc, LastName desc');
      expect(result).toHaveLength(2);

      expect(result[0].exps[0].value).toBe('FirstName');
      expect(result[1].exps[0].value).toBe('LastName');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid characters', () => {
      expect(() => parser.parse('name @ age')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for missing field name', () => {
      expect(() => parser.parse('asc')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for invalid direction', () => {
      expect(() => parser.parse('name invalid')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for trailing comma', () => {
      expect(() => parser.parse('name asc,')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for leading comma', () => {
      expect(() => parser.parse(',name asc')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for double comma', () => {
      expect(() => parser.parse('name asc,, age desc')).toThrow(ODataOrderByParseError);
    });

    it('should throw error for missing field after comma', () => {
      expect(() => parser.parse('name asc, desc')).toThrow(ODataOrderByParseError);
    });
  });

  describe('Utility Functions', () => {
    it('should work with parseOrderBy utility function', () => {
      const result = parseOrderBy('name asc');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
    });

    it('should work with parseOrderBy with field mapping', () => {
      const fieldMap = new Map([['name', 'user_name']]);
      const result = parseOrderBy('name desc', fieldMap);
      expect(result).toHaveLength(1);
      expect(result[0].exps[0].value).toBe('user_name');
    });
  });

  describe('Real-world Examples', () => {
    it('should parse typical user listing orderby', () => {
      const result = parser.parse('name asc, createdAt desc');
      expect(result).toHaveLength(2);

      expect(result[0].exps[0].value).toBe('user_name'); // mapped
      expect(result[0].operator).toBe(20); // Asc
      expect(result[1].exps[0].value).toBe('created_at'); // mapped
      expect(result[1].operator).toBe(21); // Desc
    });

    it('should parse product catalog orderby', () => {
      const result = parser.parse('category, price desc, name asc');
      expect(result).toHaveLength(3);

      expect(result[0].operator).toBe(20); // Asc (default)
      expect(result[1].operator).toBe(21); // Desc
      expect(result[2].operator).toBe(20); // Asc
    });

    it('should parse complex reporting orderby', () => {
      const result = parser.parse('department asc, salary desc, name, employeeId desc');
      expect(result).toHaveLength(4);

      expect(result[0].operator).toBe(20); // Asc
      expect(result[1].operator).toBe(21); // Desc
      expect(result[2].operator).toBe(20); // Asc (default)
      expect(result[3].operator).toBe(21); // Desc
    });
  });

  describe('Expression Structure', () => {
    it('should create proper Expression structure for single field', () => {
      const result = parser.parse('name desc');
      expect(result).toHaveLength(1);

      const expr = result[0];
      expect(expr.value).toBeNull();
      expect(expr.operator).toBe(21); // Operator.Desc
      expect(expr.exps).toHaveLength(1);
      expect(expr.exps[0].value).toBe('user_name');
      expect(expr.exps[0].operator).toBeNull();
    });

    it('should create proper Expression structure for multiple fields', () => {
      const result = parser.parse('name asc, age desc');
      expect(result).toHaveLength(2);

      // First expression (name asc)
      const firstExpr = result[0];
      expect(firstExpr.value).toBeNull();
      expect(firstExpr.operator).toBe(20); // Operator.Asc
      expect(firstExpr.exps).toHaveLength(1);
      expect(firstExpr.exps[0].value).toBe('user_name');

      // Second expression (age desc)
      const secondExpr = result[1];
      expect(secondExpr.value).toBeNull();
      expect(secondExpr.operator).toBe(21); // Operator.Desc
      expect(secondExpr.exps).toHaveLength(1);
      expect(secondExpr.exps[0].value).toBe('user_age');
    });
  });
});

describe('OData OrderBy Parser Integration', () => {
  it('should integrate with existing orderby system', () => {
    // This test ensures that the generated Expression objects are compatible
    // with the existing OrderExprBuilder system
    const fieldMap = new Map([['name', 'user_name']]);
    const parser = new OrderByParser(fieldMap);

    const expressions = parser.parse('name asc, age desc');

    expect(expressions).toHaveLength(2);

    // Check first expression structure
    expect(expressions[0]).toBeDefined();
    expect(expressions[0].operator).toBe(20); // Operator.Asc
    expect(expressions[0].exps).toHaveLength(1);

    // Check second expression structure
    expect(expressions[1]).toBeDefined();
    expect(expressions[1].operator).toBe(21); // Operator.Desc
    expect(expressions[1].exps).toHaveLength(1);

    // The expressions should be usable in the existing system
    // This would typically be tested in integration tests with actual SQL generation
  });
});
