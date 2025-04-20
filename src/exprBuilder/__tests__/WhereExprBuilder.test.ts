import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataType, IEntityType } from 'dblink-core/src/types.js';
import Expression from 'dblink-core/src/sql/Expression.js';
import { FieldMapping, WhereExprBuilder } from '../index.js';

interface IDataType<T> {
  value: T;
}

interface Person {
  id: number;
  name: string;
  age: number;
}

describe('WhereExprBuilder', () => {
  interface TestType {
    id: number;
    name: string;
    age: number;
    active: boolean;
  }

  let fieldMap: Map<string, FieldMapping>;
  let builder: WhereExprBuilder<TestType>;

  beforeEach(() => {
    fieldMap = new Map();
    fieldMap.set('id', new FieldMapping('id', 'id', Number as unknown as IEntityType<DataType>, true));
    fieldMap.set('name', new FieldMapping('name', 'name', String as unknown as IEntityType<DataType>, false));
    fieldMap.set('age', new FieldMapping('age', 'age', Number as unknown as IEntityType<DataType>, false));
    fieldMap.set('active', new FieldMapping('active', 'active', Boolean as unknown as IEntityType<DataType>, false));

    builder = new WhereExprBuilder<TestType>(fieldMap);
  });

  it('should create greater than or equal expression', () => {
    const expr = builder.gteq('age', 21);
    expect(expr instanceof Expression).toBeTruthy();
    expect(expr.args[0]).toBe(21);
  });

  it('should create less than or equal expression', () => {
    const expr = builder.lteq('age', 60);
    expect(expr instanceof Expression).toBeTruthy();
    expect(expr.args[0]).toBe(60);
  });

  it('should create IN expression', () => {
    const expr = builder.in('name', 'John', 'Jane', 'Bob');
    expect(expr instanceof Expression).toBeTruthy();
    expect(expr.args).toEqual(['John', 'Jane', 'Bob']);
  });

  it('should create IS NULL expression', () => {
    const expr = builder.IsNull('name');
    expect(expr instanceof Expression).toBeTruthy();
  });

  it('should create IS NOT NULL expression', () => {
    const expr = builder.IsNotNull('name');
    expect(expr instanceof Expression).toBeTruthy();
  });

  it('should build equality expressions', () => {
    const expr = builder.eq('age', 25);
    expect(expr instanceof Expression).toBeTruthy();
    expect(expr.args).toContain(25);
  });

  it('should handle multiple conditions', () => {
    const expr1 = builder.gt('age', 18);
    const expr2 = builder.lt('age', 65);

    expect(expr1 instanceof Expression).toBeTruthy();
    expect(expr2 instanceof Expression).toBeTruthy();
    expect(expr1.args).toContain(18);
    expect(expr2.args).toContain(65);
  });
});
