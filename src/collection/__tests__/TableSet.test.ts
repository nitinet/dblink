import { describe, expect, it, jest } from '@jest/globals';
import 'reflect-metadata';

// Mock all required dblink-core dependencies
jest.mock(
  'dblink-core/src/sql/Expression.js',
  () => ({
    default: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      value: null
    }))
  }),
  { virtual: true }
);

jest.mock(
  'dblink-core/src/sql/index.js',
  () => ({
    Statement: jest.fn(),
    Expression: jest.fn(),
    Collection: jest.fn(),
    types: {
      Command: {
        SELECT: 'SELECT',
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
      }
    }
  }),
  { virtual: true }
);

jest.mock(
  'dblink-core/src/types.js',
  () => ({
    IEntityType: jest.fn()
  }),
  { virtual: true }
);

// Mock sub-dependencies
jest.mock(
  'dblink-core/src/sql/types/Operator.js',
  () => ({
    default: {
      AND: 'AND',
      OR: 'OR',
      EQ: '='
    }
  }),
  { virtual: true }
);

import TableSet from '../../collection/TableSet.js';
import { Column, Id, Table } from '../../decorators/index.js';

describe('TableSet', () => {
  @Table('test_users')
  class TestUser {
    @Id
    @Column('user_id')
    id: number = 0;

    @Column('first_name')
    firstName: string = '';

    @Column()
    lastName: string = '';

    @Column('created_at')
    createdAt: Date = new Date();
  }

  describe('constructor', () => {
    it('should create TableSet instance with correct metadata', () => {
      const tableSet = new TableSet(TestUser);
      expect(tableSet).toBeInstanceOf(TableSet);
      expect(tableSet.dbSet.tableName).toBe('test_users');
    });

    it('should throw error if table name metadata is missing', () => {
      class InvalidTable {
        @Column()
        name: string = '';
      }

      expect(() => new TableSet(InvalidTable)).toThrow('Table Name Not Found');
    });
  });

  describe('DBSet creation', () => {
    it('should create field mappings for all columns', () => {
      const tableSet = new TableSet(TestUser);
      const fieldMap = tableSet.dbSet.fieldMap;

      expect(fieldMap.size).toBe(4);
      expect(fieldMap.get('id')?.colName).toBe('user_id');
      expect(fieldMap.get('firstName')?.colName).toBe('first_name');
      expect(fieldMap.get('lastName')?.colName).toBe('lastName');
      expect(fieldMap.get('createdAt')?.colName).toBe('created_at');
    });

    it('should identify primary key fields', () => {
      const tableSet = new TableSet(TestUser);
      const idField = tableSet.dbSet.fieldMap.get('id');

      expect(idField?.primaryKey).toBe(true);
      expect(idField?.dataType).toBe(Number);
    });

    it('should set correct data types for fields', () => {
      const tableSet = new TableSet(TestUser);
      const fieldMap = tableSet.dbSet.fieldMap;

      expect(fieldMap.get('firstName')?.dataType).toBe(String);
      expect(fieldMap.get('lastName')?.dataType).toBe(String);
      expect(fieldMap.get('createdAt')?.dataType).toBe(Date);
    });
  });
});
