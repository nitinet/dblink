import { beforeEach, describe, expect, it } from '@jest/globals';
import { IEntityType } from 'dblink-core/src/types.js';
import Expression from 'dblink-core/src/sql/Expression.js';
import OrderExprBuilder from '../OrderExprBuilder.js';
import FieldMapping from '../FieldMapping.js';

describe('OrderExprBuilder', () => {
  interface TestType {
    id: number;
    name: string;
    age: number;
    score: number;
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
  let builder: OrderExprBuilder<TestType>;

  beforeEach(() => {
    fieldMap = new Map();
    fieldMap.set('id', new FieldMapping('id', 'user_id', NumberType, true));
    fieldMap.set('name', new FieldMapping('name', 'user_name', StringType, false));
    fieldMap.set('age', new FieldMapping('age', 'user_age', NumberType, false));
    fieldMap.set('score', new FieldMapping('score', 'user_score', NumberType, false));
    builder = new OrderExprBuilder<TestType>(fieldMap);
  });

  describe('asc', () => {
    it('should create ascending order expression', () => {
      const expr = builder.asc('name');
      expect(expr).toBeInstanceOf(Expression);
      expect(expr.exps).toEqual(['user_name ASC']);
    });

    it('should create ascending order expression with table alias', () => {
      const builderWithAlias = new OrderExprBuilder<TestType>(fieldMap, 'u');
      const expr = builderWithAlias.asc('age');
      expect(expr.exps).toEqual(['u.user_age ASC']);
    });

    it('should throw error for non-existent field', () => {
      expect(() => {
        builder.asc('nonexistent' as keyof TestType);
      }).toThrow('Field Not Found');
    });
  });

  describe('desc', () => {
    it('should create descending order expression', () => {
      const expr = builder.desc('score');
      expect(expr).toBeInstanceOf(Expression);
      expect(expr.exps).toEqual(['user_score DESC']);
    });

    it('should create descending order expression with table alias', () => {
      const builderWithAlias = new OrderExprBuilder<TestType>(fieldMap, 'u');
      const expr = builderWithAlias.desc('id');
      expect(expr.exps).toEqual(['u.user_id DESC']);
    });

    it('should throw error for non-existent field', () => {
      expect(() => {
        builder.desc('nonexistent' as keyof TestType);
      }).toThrow('Field Not Found');
    });
  });

  describe('multiple order expressions', () => {
    it('should support combining multiple order expressions', () => {
      const expr1 = builder.asc('name');
      const expr2 = builder.desc('age');
      expect(expr1.exps).toEqual(['user_name ASC']);
      expect(expr2.exps).toEqual(['user_age DESC']);
    });

    it('should maintain field type information', () => {
      const expr1 = builder.asc('score');
      const expr2 = builder.desc('id');
      expect(expr1.exps).toEqual(['user_score ASC']);
      expect(expr2.exps).toEqual(['user_id DESC']);
    });
  });
});
