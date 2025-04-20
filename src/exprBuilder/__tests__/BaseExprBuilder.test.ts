import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataType, IEntityType } from 'dblink-core/src/types.js';
import Expression from 'dblink-core/src/sql/Expression.js';
import BaseExprBuilder from '../BaseExprBuilder.js';
import FieldMapping from '../FieldMapping.js';

describe('BaseExprBuilder', () => {
  interface TestType {
    id: number;
    name: string;
  }

  // Create proper IEntityType implementations for primitive types
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

  let fieldMap: Map<string | symbol, FieldMapping>;
  let builder: BaseExprBuilder<TestType>;

  beforeEach(() => {
    fieldMap = new Map();
    fieldMap.set('id', new FieldMapping('id', 'user_id', NumberType, true));
    fieldMap.set('name', new FieldMapping('name', 'user_name', StringType, false));
    builder = new BaseExprBuilder<TestType>(fieldMap);
  });

  describe('_expr', () => {
    it('should create expression with correct column name', () => {
      const expr = builder['_expr']('id');
      expect(expr).toBeInstanceOf(Expression);
      expect(expr.exps[0]).toBe('user_id');
    });

    it('should create expression with alias if provided', () => {
      const builderWithAlias = new BaseExprBuilder<TestType>(fieldMap, 'u');
      const expr = builderWithAlias['_expr']('name');
      expect(expr.exps[0]).toBe('u.user_name');
    });

    it('should throw error for non-existent field', () => {
      expect(() => {
        builder['_expr']('nonexistent' as keyof TestType);
      }).toThrow('Field Not Found');
    });
  });
});
