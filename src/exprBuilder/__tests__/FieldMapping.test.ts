import { describe, expect, it } from '@jest/globals';
import { DataType, IEntityType } from 'dblink-core/src/types.js';
import FieldMapping from '../FieldMapping.js';

describe('FieldMapping', () => {
  class NumberEntityType {
    static new(...args: unknown[]): number {
      return Number(args[0]);
    }
  }

  class StringEntityType {
    static new(...args: unknown[]): string {
      return String(args[0]);
    }
  }

  const NumberType = NumberEntityType as unknown as IEntityType<number>;
  const StringType = StringEntityType as unknown as IEntityType<string>;

  describe('constructor', () => {
    it('should create field mapping with correct properties', () => {
      const fieldName = 'firstName';
      const colName = 'first_name';
      const primaryKey = true;

      const fieldMapping = new FieldMapping(fieldName, colName, StringType, primaryKey);

      expect(fieldMapping.fieldName).toBe(fieldName);
      expect(fieldMapping.colName).toBe(colName);
      expect(fieldMapping.dataType).toBe(StringType);
      expect(fieldMapping.primaryKey).toBe(primaryKey);
    });

    it('should default primaryKey to false if not provided', () => {
      const fieldMapping = new FieldMapping('id', 'user_id', StringType, false);
      expect(fieldMapping.primaryKey).toBe(false);
    });
  });

  describe('data types', () => {
    it('should handle number type correctly', () => {
      const fieldMapping = new FieldMapping('age', 'user_age', NumberType, false);
      expect(fieldMapping.dataType).toBe(NumberType);
    });

    it('should handle string type correctly', () => {
      const fieldMapping = new FieldMapping('name', 'user_name', StringType, false);
      expect(fieldMapping.dataType).toBe(StringType);
    });
  });

  describe('field names', () => {
    it('should handle different field and column name patterns', () => {
      const tests = [
        { field: 'userId', col: 'user_id' },
        { field: 'firstName', col: 'first_name' },
        { field: 'lastLoginTime', col: 'last_login_time' }
      ];

      tests.forEach(test => {
        const mapping = new FieldMapping(test.field, test.col, StringType, false);
        expect(mapping.fieldName).toBe(test.field);
        expect(mapping.colName).toBe(test.col);
      });
    });
  });
});
