var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import * as decorators from '../src/decorators/index.js';
import { TABLE_KEY, TABLE_COLUMN_KEYS, COLUMN_KEY, ID_KEY, FOREIGN_KEY_TYPE, FOREIGN_KEY_FUNC } from '../src/decorators/Constants.js';
describe('Decorators', () => {
    describe('@Table', () => {
        it('should mark class with table metadata', () => {
            let TestEntity = class TestEntity {
            };
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const tableName = Reflect.getMetadata(TABLE_KEY, TestEntity);
            expect(tableName).toBe('test_table');
        });
        it('should use class name as default table name', () => {
            let DefaultTable = class DefaultTable {
            };
            DefaultTable = __decorate([
                decorators.Table()
            ], DefaultTable);
            const tableName = Reflect.getMetadata(TABLE_KEY, DefaultTable);
            expect(tableName).toBe('DefaultTable');
        });
        it('should handle table name with different casing', () => {
            let UpperCaseTable = class UpperCaseTable {
            };
            UpperCaseTable = __decorate([
                decorators.Table('USERS')
            ], UpperCaseTable);
            const tableName = Reflect.getMetadata(TABLE_KEY, UpperCaseTable);
            expect(tableName).toBe('USERS');
        });
    });
    describe('@Column', () => {
        it('should mark property with column metadata', () => {
            let TestEntity = class TestEntity {
                testProperty;
            };
            __decorate([
                decorators.Column('custom_column'),
                __metadata("design:type", String)
            ], TestEntity.prototype, "testProperty", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'testProperty');
            expect(columnName).toBe('custom_column');
        });
        it('should use property name as default column name', () => {
            let TestEntity = class TestEntity {
                defaultColumn;
            };
            __decorate([
                decorators.Column(),
                __metadata("design:type", String)
            ], TestEntity.prototype, "defaultColumn", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'defaultColumn');
            expect(columnName).toBe('defaultColumn');
        });
        it('should register column in table column keys', () => {
            let TestEntity = class TestEntity {
                column1;
                column2;
            };
            __decorate([
                decorators.Column(),
                __metadata("design:type", String)
            ], TestEntity.prototype, "column1", void 0);
            __decorate([
                decorators.Column(),
                __metadata("design:type", Number)
            ], TestEntity.prototype, "column2", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, TestEntity.prototype);
            expect(columnKeys).toContain('column1');
            expect(columnKeys).toContain('column2');
        });
        it('should handle snake_case column names', () => {
            let TestEntity = class TestEntity {
                firstName;
                createdAt;
            };
            __decorate([
                decorators.Column('first_name'),
                __metadata("design:type", String)
            ], TestEntity.prototype, "firstName", void 0);
            __decorate([
                decorators.Column('created_at'),
                __metadata("design:type", Date)
            ], TestEntity.prototype, "createdAt", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const firstNameColumn = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'firstName');
            const createdAtColumn = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'createdAt');
            expect(firstNameColumn).toBe('first_name');
            expect(createdAtColumn).toBe('created_at');
        });
    });
    describe('@Id', () => {
        it('should mark property as primary key', () => {
            let TestEntity = class TestEntity {
                id;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], TestEntity.prototype, "id", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const isPrimaryKey = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id');
            expect(isPrimaryKey).toBe(true);
        });
        it('should work with column decorator', () => {
            let TestEntity = class TestEntity {
                id;
            };
            __decorate([
                decorators.Column('user_id'),
                decorators.Id,
                __metadata("design:type", Number)
            ], TestEntity.prototype, "id", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const isPrimaryKey = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id');
            const columnName = Reflect.getMetadata(COLUMN_KEY, TestEntity.prototype, 'id');
            expect(isPrimaryKey).toBe(true);
            expect(columnName).toBe('user_id');
        });
        it('should support composite primary keys', () => {
            let TestEntity = class TestEntity {
                id1;
                id2;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], TestEntity.prototype, "id1", void 0);
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], TestEntity.prototype, "id2", void 0);
            TestEntity = __decorate([
                decorators.Table('test_table')
            ], TestEntity);
            const isPrimaryKey1 = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id1');
            const isPrimaryKey2 = Reflect.getMetadata(ID_KEY, TestEntity.prototype, 'id2');
            expect(isPrimaryKey1).toBe(true);
            expect(isPrimaryKey2).toBe(true);
        });
    });
    describe('@Foreign', () => {
        it('should mark property with foreign key metadata', () => {
            let User = class User {
                id;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], User.prototype, "id", void 0);
            User = __decorate([
                decorators.Table('users')
            ], User);
            let Order = class Order {
                id;
                userId;
                user;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Order.prototype, "id", void 0);
            __decorate([
                decorators.Column('user_id'),
                __metadata("design:type", Number)
            ], Order.prototype, "userId", void 0);
            __decorate([
                decorators.Foreign(User, (builder, parent) => builder.eq('id', parent.userId)),
                __metadata("design:type", User)
            ], Order.prototype, "user", void 0);
            Order = __decorate([
                decorators.Table('orders')
            ], Order);
            const foreignKeyType = Reflect.getMetadata(FOREIGN_KEY_TYPE, Order.prototype, 'user');
            const foreignKeyFunc = Reflect.getMetadata(FOREIGN_KEY_FUNC, Order.prototype, 'user');
            expect(foreignKeyType).toBe(User);
            expect(foreignKeyFunc).toBeInstanceOf(Function);
        });
        it('should support one-to-many relationships', () => {
            let Department = class Department {
                id;
                name;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Department.prototype, "id", void 0);
            __decorate([
                decorators.Column(),
                __metadata("design:type", String)
            ], Department.prototype, "name", void 0);
            Department = __decorate([
                decorators.Table('departments')
            ], Department);
            let Employee = class Employee {
                id;
                departmentId;
                department;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Employee.prototype, "id", void 0);
            __decorate([
                decorators.Column('department_id'),
                __metadata("design:type", Number)
            ], Employee.prototype, "departmentId", void 0);
            __decorate([
                decorators.Foreign(Department, (builder, parent) => builder.eq('id', parent.departmentId)),
                __metadata("design:type", Department)
            ], Employee.prototype, "department", void 0);
            Employee = __decorate([
                decorators.Table('employees')
            ], Employee);
            const foreignKeyType = Reflect.getMetadata(FOREIGN_KEY_TYPE, Employee.prototype, 'department');
            expect(foreignKeyType).toBe(Department);
        });
    });
    describe('Integration Tests', () => {
        it('should support complete entity definition from README', () => {
            let User = class User {
                id;
                firstName;
                lastName;
                email;
                createdAt;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], User.prototype, "id", void 0);
            __decorate([
                decorators.Column('first_name'),
                __metadata("design:type", String)
            ], User.prototype, "firstName", void 0);
            __decorate([
                decorators.Column('last_name'),
                __metadata("design:type", String)
            ], User.prototype, "lastName", void 0);
            __decorate([
                decorators.Column(),
                __metadata("design:type", String)
            ], User.prototype, "email", void 0);
            __decorate([
                decorators.Column('created_at'),
                __metadata("design:type", Date)
            ], User.prototype, "createdAt", void 0);
            User = __decorate([
                decorators.Table('users')
            ], User);
            let Order = class Order {
                id;
                userId;
                user;
                orderDate;
                totalAmount;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Order.prototype, "id", void 0);
            __decorate([
                decorators.Column('user_id'),
                __metadata("design:type", Number)
            ], Order.prototype, "userId", void 0);
            __decorate([
                decorators.Foreign(User, (builder, parent) => builder.eq('id', parent.userId)),
                __metadata("design:type", User)
            ], Order.prototype, "user", void 0);
            __decorate([
                decorators.Column('order_date'),
                __metadata("design:type", Date)
            ], Order.prototype, "orderDate", void 0);
            __decorate([
                decorators.Column('total_amount'),
                __metadata("design:type", Number)
            ], Order.prototype, "totalAmount", void 0);
            Order = __decorate([
                decorators.Table('orders')
            ], Order);
            expect(Reflect.getMetadata(TABLE_KEY, User)).toBe('users');
            expect(Reflect.getMetadata(ID_KEY, User.prototype, 'id')).toBe(true);
            expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'firstName')).toBe('first_name');
            expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'lastName')).toBe('last_name');
            expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'email')).toBe('email');
            expect(Reflect.getMetadata(COLUMN_KEY, User.prototype, 'createdAt')).toBe('created_at');
            expect(Reflect.getMetadata(TABLE_KEY, Order)).toBe('orders');
            expect(Reflect.getMetadata(ID_KEY, Order.prototype, 'id')).toBe(true);
            expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'userId')).toBe('user_id');
            expect(Reflect.getMetadata(FOREIGN_KEY_TYPE, Order.prototype, 'user')).toBe(User);
            expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'orderDate')).toBe('order_date');
            expect(Reflect.getMetadata(COLUMN_KEY, Order.prototype, 'totalAmount')).toBe('total_amount');
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
                id;
                name;
            }
            const tableName = Reflect.getMetadata(TABLE_KEY, PlainEntity);
            const columnKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, PlainEntity.prototype);
            expect(tableName).toBeUndefined();
            expect(columnKeys).toBeUndefined();
        });
        it('should maintain separate metadata for different entities', () => {
            let Entity1 = class Entity1 {
                id;
                name;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Entity1.prototype, "id", void 0);
            __decorate([
                decorators.Column('name1'),
                __metadata("design:type", String)
            ], Entity1.prototype, "name", void 0);
            Entity1 = __decorate([
                decorators.Table('table1')
            ], Entity1);
            let Entity2 = class Entity2 {
                id;
                name;
            };
            __decorate([
                decorators.Column(),
                decorators.Id,
                __metadata("design:type", Number)
            ], Entity2.prototype, "id", void 0);
            __decorate([
                decorators.Column('name2'),
                __metadata("design:type", String)
            ], Entity2.prototype, "name", void 0);
            Entity2 = __decorate([
                decorators.Table('table2')
            ], Entity2);
            expect(Reflect.getMetadata(TABLE_KEY, Entity1)).toBe('table1');
            expect(Reflect.getMetadata(TABLE_KEY, Entity2)).toBe('table2');
            expect(Reflect.getMetadata(COLUMN_KEY, Entity1.prototype, 'name')).toBe('name1');
            expect(Reflect.getMetadata(COLUMN_KEY, Entity2.prototype, 'name')).toBe('name2');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVjb3JhdG9ycy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUM5QyxPQUFPLGtCQUFrQixDQUFDO0FBQzFCLE9BQU8sS0FBSyxVQUFVLE1BQU0sNEJBQTRCLENBQUM7QUFDekQsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFdEksUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDdEIsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUUvQyxJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFVO2FBQUcsQ0FBQTtZQUFiLFVBQVU7Z0JBRGYsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7ZUFDekIsVUFBVSxDQUFHO1lBRW5CLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBRXJELElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7YUFBRyxDQUFBO1lBQWYsWUFBWTtnQkFEakIsVUFBVSxDQUFDLEtBQUssRUFBRTtlQUNiLFlBQVksQ0FBRztZQUVyQixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMv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