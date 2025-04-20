import { describe, expect, it } from '@jest/globals';
import 'reflect-metadata';
import { Column, Id, Table } from '../../decorators/index.js';
import { COLUMN_KEY, ID_KEY, TABLE_COLUMN_KEYS, TABLE_KEY } from '../../decorators/Constants.js';

describe('Decorators', () => {
  describe('@Table', () => {
    it('should set table name metadata when name is provided', () => {
      @Table('users')
      class TestTable {}

      const tableName = Reflect.getMetadata(TABLE_KEY, TestTable);
      expect(tableName).toBe('users');
    });

    it('should use class name as table name when no name provided', () => {
      @Table()
      class Users {}

      const tableName = Reflect.getMetadata(TABLE_KEY, Users);
      expect(tableName).toBe('Users');
    });
  });

  describe('@Column', () => {
    it('should set column name metadata when name is provided', () => {
      class TestColumn {
        @Column('first_name')
        firstName: string = '';
      }

      const columnName = Reflect.getMetadata(COLUMN_KEY, TestColumn.prototype, 'firstName');
      expect(columnName).toBe('first_name');
    });

    it('should use property name as column name when no name provided', () => {
      class TestColumn {
        @Column()
        firstName: string = '';
      }

      const columnName = Reflect.getMetadata(COLUMN_KEY, TestColumn.prototype, 'firstName');
      expect(columnName).toBe('firstName');
    });

    it('should add column to TABLE_COLUMN_KEYS metadata', () => {
      class TestColumn {
        @Column()
        firstName: string = '';

        @Column('last_name')
        lastName: string = '';
      }

      const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, TestColumn.prototype);
      expect(columnKeys).toContain('firstName');
      expect(columnKeys).toContain('lastName');
    });
  });

  describe('@Id', () => {
    it('should set primary key metadata', () => {
      class TestId {
        @Id
        @Column()
        id: number = 0;
      }

      const isPrimaryKey = Reflect.getMetadata(ID_KEY, TestId.prototype, 'id');
      expect(isPrimaryKey).toBe(true);
    });
  });

  describe('Combined decorators', () => {
    it('should work with all decorators together', () => {
      @Table('users')
      class User {
        @Id
        @Column('user_id')
        id: number = 0;

        @Column('first_name')
        firstName: string = '';

        @Column()
        lastName: string = '';
      }

      const tableName = Reflect.getMetadata(TABLE_KEY, User);
      const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, User.prototype);
      const idColumnName = Reflect.getMetadata(COLUMN_KEY, User.prototype, 'id');
      const isPrimaryKey = Reflect.getMetadata(ID_KEY, User.prototype, 'id');

      expect(tableName).toBe('users');
      expect(columnKeys).toContain('id');
      expect(columnKeys).toContain('firstName');
      expect(columnKeys).toContain('lastName');
      expect(idColumnName).toBe('user_id');
      expect(isPrimaryKey).toBe(true);
    });
  });
});
