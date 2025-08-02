import { describe, it, expect, beforeEach } from 'vitest';
import SelectParser from '../src/odata-parser/selectParser.js';

describe('OData Select Parser', () => {
  let parser: SelectParser;

  beforeEach(() => {
    parser = new SelectParser();
  });

  describe('Basic Field Selection', () => {
    it('should parse single field', () => {
      const result = parser.parse('name');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['name']);
      expect(result.originalQuery).toBe('name');
      expect(result.error).toBeUndefined();
    });

    it('should parse multiple fields', () => {
      const result = parser.parse('id,name,email');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'email']);
      expect(result.originalQuery).toBe('id,name,email');
    });

    it('should parse fields with underscores', () => {
      const result = parser.parse('first_name,last_name,created_at');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['first_name', 'last_name', 'created_at']);
    });

    it('should parse fields with numbers', () => {
      const result = parser.parse('field1,field2,item123');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['field1', 'field2', 'item123']);
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle spaces around commas', () => {
      const result = parser.parse('id, name, email');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'email']);
    });

    it('should handle mixed whitespace', () => {
      const result = parser.parse('id,  name,\temail,   age');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'email', 'age']);
    });

    it('should handle leading and trailing whitespace', () => {
      const result = parser.parse('  id,name,email  ');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'email']);
    });

    it('should handle newlines and tabs', () => {
      const result = parser.parse('id,\nname,\temail');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'email']);
    });
  });

  describe('Nested Property Support', () => {
    it('should parse nested properties with dots', () => {
      const result = parser.parse('user.name,user.email,profile.avatar');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['user.name', 'user.email', 'profile.avatar']);
    });

    it('should parse deeply nested properties', () => {
      const result = parser.parse('user.profile.personal.firstName');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['user.profile.personal.firstName']);
    });
  });

  describe('Error Handling', () => {
    it('should handle null input', () => {
      const result = parser.parse(null as any);

      expect(result.success).toBe(false);
      expect(result.fields).toEqual([]);
      expect(result.error).toBe('Query must be a non-empty string');
    });

    it('should handle undefined input', () => {
      const result = parser.parse(undefined as any);

      expect(result.success).toBe(false);
      expect(result.fields).toEqual([]);
      expect(result.error).toBe('Query must be a non-empty string');
    });

    it('should handle empty string', () => {
      const result = parser.parse('');

      expect(result.success).toBe(false);
      expect(result.fields).toEqual([]);
      expect(result.error).toBe('Query must be a non-empty string');
    });

    it('should handle whitespace-only string', () => {
      const result = parser.parse('   ');

      expect(result.success).toBe(false);
      expect(result.fields).toEqual([]);
      expect(result.error).toBe('No fields specified in select query');
    });

    it('should reject invalid field names starting with numbers', () => {
      const result = parser.parse('123invalid,name');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
    });

    it('should reject field names with special characters', () => {
      const result = parser.parse('field@name,email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
    });

    it('should reject empty field names', () => {
      const result = parser.parse('name,,email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected field name');
    });

    it('should reject trailing comma', () => {
      const result = parser.parse('name,email,');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected end of query after comma');
    });

    it('should reject leading comma', () => {
      const result = parser.parse(',name,email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected field name');
    });

    it('should reject multiple consecutive commas', () => {
      const result = parser.parse('name,,email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected field name');
    });
  });

  describe('Field Validation', () => {
    it('should reject duplicate fields', () => {
      const result = parser.parse('name,email,name');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate field');
    });

    it('should reject duplicate fields with different whitespace', () => {
      const result = parser.parse('name, name');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate field');
    });

    it('should allow similar but different field names', () => {
      const result = parser.parse('name,firstName,lastName');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['name', 'firstName', 'lastName']);
    });
  });

  describe('Complex Queries', () => {
    it('should parse typical user entity selection', () => {
      const result = parser.parse('id,firstName,lastName,email,createdAt,updatedAt');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']);
    });

    it('should parse mixed entity types with relationships', () => {
      const result = parser.parse('id,name,user.firstName,user.lastName,order.total');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'user.firstName', 'user.lastName', 'order.total']);
    });

    it('should handle very long field lists', () => {
      const fields = Array.from({ length: 50 }, (_, i) => `field${i + 1}`);
      const query = fields.join(',');
      const result = parser.parse(query);

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(fields);
    });
  });

  describe('Static Helper Methods', () => {
    describe('parseToFieldArray', () => {
      it('should return field array for valid query', () => {
        const fields = SelectParser.parseToFieldArray('id,name,email');

        expect(fields).toEqual(['id', 'name', 'email']);
      });

      it('should throw error for invalid query', () => {
        expect(() => {
          SelectParser.parseToFieldArray('invalid@field');
        }).toThrow('OData select parsing failed');
      });

      it('should throw error for empty query', () => {
        expect(() => {
          SelectParser.parseToFieldArray('');
        }).toThrow('OData select parsing failed');
      });
    });

    describe('isValidSelectQuery', () => {
      it('should return true for valid queries', () => {
        expect(SelectParser.isValidSelectQuery('id,name,email')).toBe(true);
        expect(SelectParser.isValidSelectQuery('user.profile.name')).toBe(true);
        expect(SelectParser.isValidSelectQuery('field1, field2, field3')).toBe(true);
      });

      it('should return false for invalid queries', () => {
        expect(SelectParser.isValidSelectQuery('invalid@field')).toBe(false);
        expect(SelectParser.isValidSelectQuery('')).toBe(false);
        expect(SelectParser.isValidSelectQuery('name,')).toBe(false);
        expect(SelectParser.isValidSelectQuery(',name')).toBe(false);
      });
    });

    describe('applySelect', () => {
      it('should apply selection to mock QuerySet', () => {
        const mockQuerySet = {
          select: (fields: string[]) => ({ selectedFields: fields, applied: true })
        };

        const result = SelectParser.applySelect(mockQuerySet, 'id,name,email');

        expect(result.selectedFields).toEqual(['id', 'name', 'email']);
        expect(result.applied).toBe(true);
      });

      it('should validate against available fields', () => {
        const mockQuerySet = {
          select: (fields: string[]) => ({ selectedFields: fields })
        };

        expect(() => {
          SelectParser.applySelect(mockQuerySet, 'id,invalidField', ['id', 'name', 'email']);
        }).toThrow('Invalid field(s) in select: invalidField');
      });

      it('should allow all fields when available fields include them', () => {
        const mockQuerySet = {
          select: (fields: string[]) => ({ selectedFields: fields })
        };

        const result = SelectParser.applySelect(mockQuerySet, 'id,name', ['id', 'name', 'email', 'createdAt']);

        expect(result.selectedFields).toEqual(['id', 'name']);
      });

      it('should work without available fields validation', () => {
        const mockQuerySet = {
          select: (fields: string[]) => ({ selectedFields: fields })
        };

        const result = SelectParser.applySelect(mockQuerySet, 'anyField,anotherField');

        expect(result.selectedFields).toEqual(['anyField', 'anotherField']);
      });

      it('should throw error for invalid OData query', () => {
        const mockQuerySet = {
          select: (fields: string[]) => ({ selectedFields: fields })
        };

        expect(() => {
          SelectParser.applySelect(mockQuerySet, 'invalid@field');
        }).toThrow('OData select parsing failed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character field names', () => {
      const result = parser.parse('a,b,c');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['a', 'b', 'c']);
    });

    it('should handle very long field names', () => {
      const longFieldName = 'a'.repeat(100);
      const result = parser.parse(longFieldName);

      expect(result.success).toBe(true);
      expect(result.fields).toEqual([longFieldName]);
    });

    it('should handle fields with only underscores', () => {
      const result = parser.parse('_field,__field,field_');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['_field', '__field', 'field_']);
    });

    it('should reject fields starting with dots', () => {
      const result = parser.parse('.invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
    });

    it('should reject fields ending with dots', () => {
      const result = parser.parse('invalid.');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
    });

    it('should reject consecutive dots in field names', () => {
      const result = parser.parse('user..name');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid field name');
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should parse typical user profile fields', () => {
      const result = parser.parse('id,firstName,lastName,email,phone,birthDate');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'firstName', 'lastName', 'email', 'phone', 'birthDate']);
    });

    it('should parse order fields with relationships', () => {
      const result = parser.parse('id,orderNumber,total,status,customer.name,customer.email');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'orderNumber', 'total', 'status', 'customer.name', 'customer.email']);
    });

    it('should parse minimal field selection', () => {
      const result = parser.parse('id,name');

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name']);
    });

    it('should parse comprehensive field selection', () => {
      const query = 'id,name,description,createdAt,updatedAt,isActive,metadata,owner.id,owner.name';
      const result = parser.parse(query);

      expect(result.success).toBe(true);
      expect(result.fields).toEqual(['id', 'name', 'description', 'createdAt', 'updatedAt', 'isActive', 'metadata', 'owner.id', 'owner.name']);
    });
  });
});

describe('OData Select Parser Integration', () => {
  describe('DBLink QuerySet Integration', () => {
    it('should demonstrate usage with mock DBLink QuerySet', () => {
      // Mock a typical DBLink QuerySet interface
      class MockQuerySet {
        private selectedFields: string[] = [];

        select(fields: string[]) {
          this.selectedFields = fields;
          return this;
        }

        getSelectedFields() {
          return this.selectedFields;
        }

        where(condition: any) {
          return this;
        }

        orderBy(orderFunc: any) {
          return this;
        }

        async list() {
          return []; // Mock empty result
        }
      }

      const querySet = new MockQuerySet();

      // Test integration with OData select parser
      const selectQuery = 'id,firstName,lastName,email';
      const fields = SelectParser.parseToFieldArray(selectQuery);
      const result = querySet.select(fields);

      expect(result.getSelectedFields()).toEqual(['id', 'firstName', 'lastName', 'email']);
    });

    it('should demonstrate error handling in integration', () => {
      class MockQuerySet {
        select(fields: string[]) {
          return this;
        }
      }

      const querySet = new MockQuerySet();

      // Test that parsing errors are propagated
      expect(() => {
        const fields = SelectParser.parseToFieldArray('invalid@field,name');
        querySet.select(fields);
      }).toThrow('OData select parsing failed');
    });

    it('should demonstrate field validation in integration', () => {
      class MockQuerySet {
        select(fields: string[]) {
          return this;
        }
      }

      const querySet = new MockQuerySet();
      const availableFields = ['id', 'firstName', 'lastName', 'email', 'createdAt'];

      // Test successful validation
      expect(() => {
        SelectParser.applySelect(querySet, 'id,firstName,email', availableFields);
      }).not.toThrow();

      // Test validation failure
      expect(() => {
        SelectParser.applySelect(querySet, 'id,invalidField', availableFields);
      }).toThrow('Invalid field(s) in select: invalidField');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large field lists efficiently', () => {
      const largeFieldList = Array.from({ length: 1000 }, (_, i) => `field${i}`).join(',');

      const startTime = Date.now();
      const result = SelectParser.parseToFieldArray(largeFieldList);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle complex nested field names efficiently', () => {
      const complexFields = Array.from({ length: 100 }, (_, i) => `level1.level2.level3.field${i}`).join(',');

      const startTime = Date.now();
      const result = SelectParser.parseToFieldArray(complexFields);
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });
  });
});
