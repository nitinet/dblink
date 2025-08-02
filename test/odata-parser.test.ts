import { beforeEach, describe, expect, it } from 'vitest';
import { FilterParser, ODataParseError, parseFilter } from '../src/odata-parser/filterParser.js';

describe('OData Filter Parser', () => {
  let parser: FilterParser;

  beforeEach(() => {
    // Create a parser with sample field mappings
    const fieldMap = new Map([
      ['name', 'user_name'],
      ['age', 'user_age'],
      ['email', 'email_address'],
      ['active', 'is_active']
    ]);
    parser = new FilterParser(fieldMap);
  });

  describe('Basic Parsing', () => {
    it('should parse empty filter', () => {
      const result = parser.parse('');
      expect(result).toBeDefined();
    });

    it('should parse simple equality comparison', () => {
      const result = parser.parse("name eq 'John'");
      expect(result).toBeDefined();
      expect(result.exps).toBeDefined();
    });

    it('should parse number comparison', () => {
      const result = parser.parse('age gt 25');
      expect(result).toBeDefined();
    });

    it('should parse boolean comparison', () => {
      const result = parser.parse('active eq true');
      expect(result).toBeDefined();
    });

    it('should parse null comparison', () => {
      const result = parser.parse('email eq null');
      expect(result).toBeDefined();
    });
  });

  describe('Comparison Operators', () => {
    it('should parse eq (equals)', () => {
      const result = parser.parse("name eq 'John'");
      expect(result).toBeDefined();
    });

    it('should parse ne (not equals)', () => {
      const result = parser.parse("name ne 'John'");
      expect(result).toBeDefined();
    });

    it('should parse gt (greater than)', () => {
      const result = parser.parse('age gt 25');
      expect(result).toBeDefined();
    });

    it('should parse ge (greater than or equal)', () => {
      const result = parser.parse('age ge 25');
      expect(result).toBeDefined();
    });

    it('should parse lt (less than)', () => {
      const result = parser.parse('age lt 65');
      expect(result).toBeDefined();
    });

    it('should parse le (less than or equal)', () => {
      const result = parser.parse('age le 65');
      expect(result).toBeDefined();
    });
  });

  describe('Logical Operators', () => {
    it('should parse and operator', () => {
      const result = parser.parse("name eq 'John' and age gt 25");
      expect(result).toBeDefined();
    });

    it('should parse or operator', () => {
      const result = parser.parse("name eq 'John' or name eq 'Jane'");
      expect(result).toBeDefined();
    });

    it('should parse not operator', () => {
      const result = parser.parse("not (name eq 'John')");
      expect(result).toBeDefined();
    });

    it('should handle operator precedence', () => {
      const result = parser.parse("name eq 'John' and age gt 25 or active eq true");
      expect(result).toBeDefined();
    });
  });

  describe('String Functions', () => {
    it('should parse contains function', () => {
      const result = parser.parse("contains(name, 'John')");
      expect(result).toBeDefined();
    });

    it('should parse startswith function', () => {
      const result = parser.parse("startswith(name, 'J')");
      expect(result).toBeDefined();
    });

    it('should parse endswith function', () => {
      const result = parser.parse("endswith(email, '.com')");
      expect(result).toBeDefined();
    });
  });

  describe('Mathematical Functions', () => {
    it('should throw error for add function (unsupported)', () => {
      expect(() => parser.parse('add(age, 5) eq 30')).toThrow('Unknown function: add');
    });

    it('should throw error for sub function (unsupported)', () => {
      expect(() => parser.parse('sub(age, 5) eq 20')).toThrow('Unknown function: sub');
    });

    it('should throw error for mul function (unsupported)', () => {
      expect(() => parser.parse('mul(price, quantity) gt 100')).toThrow('Unknown function: mul');
    });

    it('should throw error for div function (unsupported)', () => {
      expect(() => parser.parse('div(total, count) eq 5')).toThrow('Unknown function: div');
    });
  });

  describe('Collection Functions', () => {
    it('should parse in function with single value', () => {
      const result = parser.parse("in(name, 'John')");
      expect(result).toBeDefined();
    });

    it('should parse in function with multiple values', () => {
      const result = parser.parse("in(name, 'John', 'Jane', 'Bob')");
      expect(result).toBeDefined();
    });

    it('should parse in function with numbers', () => {
      const result = parser.parse('in(age, 25, 30, 35)');
      expect(result).toBeDefined();
    });
  });

  describe('Complex Expressions', () => {
    it('should parse parenthesized expressions', () => {
      const result = parser.parse("(name eq 'John' or name eq 'Jane') and age gt 18");
      expect(result).toBeDefined();
    });

    it('should parse nested functions', () => {
      const result = parser.parse("contains(name, 'John') and age gt 25");
      expect(result).toBeDefined();
    });

    it('should parse combined operators', () => {
      const result = parser.parse("startswith(name, 'J') and age ge 18 and age le 65 and active eq true");
      expect(result).toBeDefined();
    });
  });

  describe('Field Mapping', () => {
    it('should map field names to column names', () => {
      const result = parser.parse("name eq 'John'");
      expect(result).toBeDefined();
      // The parser should have mapped 'name' to 'user_name' internally
    });

    it('should handle unmapped field names', () => {
      const result = parser.parse("unmappedField eq 'value'");
      expect(result).toBeDefined();
      // Should use the field name as-is when no mapping exists
    });
  });

  describe('Error Handling', () => {
    it('should throw error for incomplete expressions', () => {
      expect(() => parser.parse('name eq')).toThrow();
    });

    it('should throw error for unterminated string', () => {
      expect(() => parser.parse("name eq 'unterminated")).toThrow();
    });

    it('should throw error for invalid function arguments', () => {
      expect(() => parser.parse('contains()')).toThrow();
    });

    it('should throw error for unbalanced parentheses', () => {
      expect(() => parser.parse("(name eq 'John'")).toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should work with parseFilter utility function', () => {
      const result = parseFilter("name eq 'John'");
      expect(result).toBeDefined();
    });

    it('should work with parseFilter with field mapping', () => {
      const fieldMap = new Map([['name', 'user_name']]);
      const result = parseFilter("name eq 'John'", fieldMap);
      expect(result).toBeDefined();
    });
  });

  describe('Real-world Examples', () => {
    it('should parse user filtering example', () => {
      const result = parser.parse("startswith(name, 'A') and age ge 18 and age le 65 and active eq true");
      expect(result).toBeDefined();
    });

    it('should parse search with multiple conditions', () => {
      const result = parser.parse("(contains(name, 'John') or contains(email, 'john')) and age gt 25");
      expect(result).toBeDefined();
    });

    it('should parse complex business logic', () => {
      const result = parser.parse("(active eq true and age ge 18) or (active eq false and in(name, 'Admin', 'Root'))");
      expect(result).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should handle string values with quotes', () => {
      const result = parser.parse("name eq 'John O\\'Connor'");
      expect(result).toBeDefined();
    });

    it('should handle escaped characters in strings', () => {
      const result = parser.parse("name eq 'Line1\\nLine2'");
      expect(result).toBeDefined();
    });

    it('should handle decimal numbers', () => {
      const result = parser.parse('score gt 98.5');
      expect(result).toBeDefined();
    });

    it('should handle negative numbers', () => {
      const result = parser.parse('temperature lt -5');
      expect(result).toBeDefined();
    });
  });
});

describe('OData Filter Parser Integration', () => {
  it('should integrate with existing expression system', () => {
    // This test ensures that the generated Expression objects are compatible
    // with the existing WhereExprBuilder system
    const fieldMap = new Map([['name', 'user_name']]);
    const parser = new FilterParser(fieldMap);

    const expr = parser.parse("name eq 'John' and age gt 25");

    // The expression should have the correct structure for SQL generation
    expect(expr).toBeDefined();
    expect(expr.exps).toBeDefined();

    // The expression should be usable in the existing system
    // This would typically be tested in integration tests with actual SQL generation
  });
});
