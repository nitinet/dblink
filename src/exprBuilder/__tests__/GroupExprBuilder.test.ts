import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataType, IEntityType } from 'dblink-core/src/types.js';
import Expression from 'dblink-core/src/sql/Expression.js';
import GroupExprBuilder from '../GroupExprBuilder.js';
import FieldMapping from '../FieldMapping.js';

describe('GroupExprBuilder', () => {
  interface TestType {
    id: number;
    name: string;
    age: number;
    category: string;
    count: number;
  }

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
  let builder: GroupExprBuilder<TestType>;

  beforeEach(() => {
    fieldMap = new Map();
    fieldMap.set('id', new FieldMapping('id', 'user_id', NumberType, true));
    fieldMap.set('name', new FieldMapping('name', 'user_name', StringType, false));
    fieldMap.set('age', new FieldMapping('age', 'user_age', NumberType, false));
    fieldMap.set('category', new FieldMapping('category', 'user_category', StringType, false));
    fieldMap.set('count', new FieldMapping('count', 'user_count', NumberType, false));
    builder = new GroupExprBuilder<TestType>(fieldMap);
  });

  describe('expr', () => {
    it('should create expression for simple field', () => {
      const expr = builder.expr('name');
      expect(expr).toBeInstanceOf(Expression);
      expect(expr.exps[0]).toBe('user_name');
    });

    it('should create expression with alias if provided', () => {
      const builderWithAlias = new GroupExprBuilder<TestType>(fieldMap, 'u');
      const expr = builderWithAlias.expr('category');
      expect(expr.exps[0]).toBe('u.user_category');
    });

    it('should handle numeric fields', () => {
      const expr = builder.expr('age');
      expect(expr.exps[0]).toBe('user_age');
    });

    it('should support multiple fields in group by', () => {
      const expr1 = builder.expr('category');
      const expr2 = builder.expr('age');
      expect(expr1.exps[0]).toBe('user_category');
      expect(expr2.exps[0]).toBe('user_age');
    });

    it('should throw error for non-existent field', () => {
      expect(() => {
        builder.expr('nonexistent' as keyof TestType);
      }).toThrow('Field Not Found');
    });

    it('should maintain field type information', () => {
      const expr = builder.expr('count');
      expect(expr).toBeInstanceOf(Expression);
      expect(expr.exps[0]).toBe('user_count');
    });
  });
});
