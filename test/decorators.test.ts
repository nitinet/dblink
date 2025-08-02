import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import * as decorators from '../src/decorators/index.js';
import { TABLE_KEY, TABLE_COLUMN_KEYS, COLUMN_KEY, ID_KEY, FOREIGN_KEY_TYPE, FOREIGN_KEY_FUNC } from '../src/decorators/Constants.js';

describe('Decorators', () => {
  describe('@Table', () => {
    it('should mark class with table metadata', () => {
      @decorators.Table('test_table')
      class TestEntity {}

      const tableName = Reflect.getMetadata(TABLE_KEY, TestEntity);
      expect(tableName).toBe('test_table');
    });

    it('should use class name as default table name', () => {
      @decorators.Table()
      class DefaultTable {}

      const tableName = Reflect.getMetadata(TABLE_KEY, DefaultTable);
      expect(tableName).toBe('DefaultTable');
    });

    it('should handle table name with different casing', () => {
      @decorators.Table('USERS')
      class UpperCaseTable {}

      const tableName = Reflect.getMetadata(TABLE_KEY, UpperCaseTable);
      expect(tableName).toBe('USERS');
    });
  });

  describe('@Column', () => {
    it('should mark property with column metadata', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column('custom_column')
        testProperty!: string;
      }

      const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'testProperty');
      expect(columnName).toBe('custom_column');
    });

    it('should use property name as default column name', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column()
        defaultColumn!: string;
      }

      const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'defaultColumn');
      expect(columnName).toBe('defaultColumn');
    });

    it('should register column in table column keys', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column()
        column1!: string;

        @decorators.Column()
        column2!: number;
      }

      const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, TestEntity.prototype);
      expect(columnKeys).toContain('column1');
      expect(columnKeys).toContain('column2');
    });

    it('should handle snake_case column names', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column('first_name')
        firstName!: string;

        @decorators.Column('created_at')
        createdAt!: Date;
      }

      const firstNameColumn = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'firstName');
      const createdAtColumn = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'createdAt');

      expect(firstNameColumn).toBe('first_name');
      expect(createdAtColumn).toBe('created_at');
    });
  });

  describe('@Id', () => {
    it('should mark property as primary key', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column()
        @decorators.Id
        id!: number;
      }

      const isPrimaryKey = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id');
      expect(isPrimaryKey).toBe(true);
    });

    it('should work with column decorator', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column('user_id')
        @decorators.Id
        id!: number;
      }

      const isPrimaryKey = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id');
      const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'id');

      expect(isPrimaryKey).toBe(true);
      expect(columnName).toBe('user_id');
    });

    it('should support composite primary keys', () => {
      @decorators.Table('test_table')
      class TestEntity {
        @decorators.Column()
        @decorators.Id
        id1!: number;

        @decorators.Column()
        @decorators.Id
        id2!: number;
      }

      const isPrimaryKey1 = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id1');
      const isPrimaryKey2 = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id2');

      expect(isPrimaryKey1).toBe(true);
      expect(isPrimaryKey2).toBe(true);
    });
  });

  describe('@Foreign', () => {
    it('should mark property with foreign key metadata', () => {
      @decorators.Table('users')
      class User {
        @decorators.Column()
        @decorators.Id
        id!: number;
      }

      @decorators.Table('orders')
      class Order {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('user_id')
        userId!: number;

        @decorators.Foreign(User, (builder, parent) => builder.eq('id', (parent as Order).userId))
        user!: User;
      }

      const foreignKeyType = Reflect.getMetadata(FOREIGN_KEY_TYPE, Order.prototype, 'user');
      const foreignKeyFunc = Reflect.getMetadata(FOREIGN_KEY_FUNC, Order.prototype, 'user');

      expect(foreignKeyType).toBe(User);
      expect(foreignKeyFunc).toBeInstanceOf(Function);
    });

    it('should support one-to-many relationships', () => {
      @decorators.Table('departments')
      class Department {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column()
        name!: string;
      }

      @decorators.Table('employees')
      class Employee {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('department_id')
        departmentId!: number;

        @decorators.Foreign(Department, (builder, parent) => builder.eq('id', (parent as Employee).departmentId))
        department!: Department;
      }

      const foreignKeyType = Reflect.getMetadata(FOREIGN_KEY_TYPE, Employee.prototype, 'department');
      expect(foreignKeyType).toBe(Department);
    });
  });

  describe('Integration Tests', () => {
    it('should support complete entity definition from README', () => {
      @decorators.Table('users')
      class User {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('first_name')
        firstName!: string;

        @decorators.Column('last_name')
        lastName!: string;

        @decorators.Column()
        email!: string;

        @decorators.Column('created_at')
        createdAt!: Date;
      }

      @decorators.Table('orders')
      class Order {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('user_id')
        userId!: number;

        @decorators.Foreign(User, (builder, parent) => builder.eq('id', (parent as Order).userId))
        user!: User;

        @decorators.Column('order_date')
        orderDate!: Date;

        @decorators.Column('total_amount')
        totalAmount!: number;
      }

      // Verify User entity metadata
      expect(Reflect.getMetadata(TABLE_KEY, User)).toBe('users');
      expect(Reflect.getMetadata(ID_KEY, User.prototype, 'id')).toBe(true);
      expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'firstName')).toBe('first_name');
      expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'lastName')).toBe('last_name');
      expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'email')).toBe('email');
      expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'createdAt')).toBe('created_at');

      // Verify Order entity metadata
      expect(Reflect.getMetadata(TABLE_KEY, Order)).toBe('orders');
      expect(Reflect.getMetadata(ID_KEY, Order.prototype, 'id')).toBe(true);
      expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'userId')).toBe('user_id');
      expect(Reflect.getMetadata(FOREIGN_KEY_TYPE, Order.prototype, 'user')).toBe(User);
      expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'orderDate')).toBe('order_date');
      expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'totalAmount')).toBe('total_amount');

      // Verify column keys are registered
      const userColumnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, User.prototype);
      const orderColumnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, Order.prototype);

      expect(userColumnKeys).toContain('id');
      expect(userColumnKeys).toContain('firstName');
      expect(userColumnKeys).toContain('lastName');
      expect(userColumnKeys).toContain('email');
      expect(userColumnKeys).toContain('createdAt');

      expect(orderColumnKeys).toContain('id');
      expect(orderColumnKeys).toContain('userId');
      expect(orderColumnKeys).toContain('orderDate');
      expect(orderColumnKeys).toContain('totalAmount');
    });

    it('should handle entity without decorators gracefully', () => {
      class PlainEntity {
        id!: number;
        name!: string;
      }

      const tableName = Reflect.getMetadata(TABLE_KEY, PlainEntity);
      const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, PlainEntity.prototype);

      expect(tableName).toBeUndefined();
      expect(columnKeys).toBeUndefined();
    });

    it('should maintain separate metadata for different entities', () => {
      @decorators.Table('table1')
      class Entity1 {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('name1')
        name!: string;
      }

      @decorators.Table('table2')
      class Entity2 {
        @decorators.Column()
        @decorators.Id
        id!: number;

        @decorators.Column('name2')
        name!: string;
      }

      expect(Reflect.getMetadata(TABLE_KEY, Entity1)).toBe('table1');
      expect(Reflect.getMetadata(TABLE_KEY, Entity2)).toBe('table2');
      expect(Reflect.getMetadata(COLUMN_KEY, Entity1.prototype, 'name')).toBe('name1');
      expect(Reflect.getMetadata(COLUMN_KEY, Entity2.prototype, 'name')).toBe('name2');
    });
  });
});
