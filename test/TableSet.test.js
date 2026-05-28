import PostgreSql from 'dblink-pg';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import TableSet from '../src/collection/TableSet.js';
import Employee from './model/Employee.js';
import TestDbContext from './TestDbContext.js';
const TEST_DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'dblink_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
};
async function createTestTables(context) {
    try {
        await context.handler.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await context.handler.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        bio TEXT,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await context.handler.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10,2),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
    catch (error) {
        console.warn('Could not create test tables:', error);
    }
}
async function cleanupTestTables(context) {
    try {
        await context.handler.run('DROP TABLE IF EXISTS orders CASCADE');
        await context.handler.run('DROP TABLE IF EXISTS profiles CASCADE');
        await context.handler.run('DROP TABLE IF EXISTS users CASCADE');
    }
    catch (error) {
        console.warn('Could not cleanup test tables:', error);
    }
}
describe('TableSet', () => {
    let context;
    let employeeTableSet;
    beforeEach(async () => {
        const handler = new PostgreSql(TEST_DB_CONFIG);
        await handler.init();
        context = new TestDbContext(handler);
        await context.init();
        await createTestTables(context);
        employeeTableSet = context.employees;
    });
    afterEach(async () => {
        if (!context)
            return;
        try {
            await cleanupTestTables(context);
        }
        catch (error) {
            console.warn('Error during test cleanup:', error);
        }
    });
    describe('Entity Mapping', () => {
        it('should correctly map entity types', () => {
            expect(employeeTableSet.getEntityType()).toBe(Employee);
        });
        it('should create correct table mappings', () => {
            expect(employeeTableSet.dbSet.tableName).toBe('employees');
        });
        it('should map column names correctly', () => {
            expect(employeeTableSet.dbSet.fieldMap.has('id')).toBe(true);
            expect(employeeTableSet.dbSet.fieldMap.has('firstName')).toBe(true);
            expect(employeeTableSet.dbSet.fieldMap.has('lastName')).toBe(true);
            expect(employeeTableSet.dbSet.fieldMap.has('email')).toBe(true);
            expect(employeeTableSet.dbSet.fieldMap.has('createdAt')).toBe(true);
            expect(employeeTableSet.dbSet.fieldMap.get('firstName')?.colName).toBe('first_name');
            expect(employeeTableSet.dbSet.fieldMap.get('lastName')?.colName).toBe('last_name');
            expect(employeeTableSet.dbSet.fieldMap.get('createdAt')?.colName).toBe('created_at');
            expect(employeeTableSet.dbSet.fieldMap.get('email')?.colName).toBe('email');
        });
        it('should identify primary key fields', () => {
            const idField = employeeTableSet.dbSet.fieldMap.get('id');
            expect(idField?.primaryKey).toBe(true);
        });
    });
    describe('Context Integration', () => {
        it('should be bound to context after initialization', () => {
            expect(employeeTableSet.context).toBe(context);
        });
        it('should be registered in context tableSetMap', () => {
            expect(context.tableSetMap.get(Employee)).toBe(employeeTableSet);
        });
    });
    describe('Query Building Capabilities', () => {
        it('should support basic query structure', () => {
            expect(employeeTableSet).toHaveProperty('where');
            expect(employeeTableSet).toHaveProperty('orderBy');
            expect(employeeTableSet).toHaveProperty('select');
            expect(employeeTableSet).toHaveProperty('include');
            expect(employeeTableSet).toHaveProperty('limit');
        });
        it('should support CRUD operations interface', () => {
            expect(employeeTableSet).toHaveProperty('insert');
            expect(employeeTableSet).toHaveProperty('update');
            expect(employeeTableSet).toHaveProperty('delete');
        });
        it('should support aggregation operations', () => {
            expect(employeeTableSet).toHaveProperty('count');
        });
        it('should support result retrieval methods', () => {
            expect(employeeTableSet).toHaveProperty('list');
            expect(employeeTableSet).toHaveProperty('single');
        });
    });
    describe('Error Handling', () => {
        it('should throw error for entity without Table decorator', () => {
            class InvalidEntity {
            }
            expect(() => new TableSet(InvalidEntity)).toThrow('Table Name Not Found');
        });
    });
    describe('Decorator Integration', () => {
        it('should respect @Table decorator for table naming', () => {
            expect(employeeTableSet.dbSet.tableName).toBe('employees');
        });
        it('should respect @Column decorator for column mapping', () => {
            const firstNameField = employeeTableSet.dbSet.fieldMap.get('firstName');
            expect(firstNameField?.colName).toBe('first_name');
            const emailField = employeeTableSet.dbSet.fieldMap.get('email');
            expect(emailField?.colName).toBe('email');
        });
        it('should respect @Id decorator for primary key identification', () => {
            const idField = employeeTableSet.dbSet.fieldMap.get('id');
            expect(idField?.primaryKey).toBe(true);
            const emailField = employeeTableSet.dbSet.fieldMap.get('email');
            expect(emailField?.primaryKey).toBe(false);
        });
    });
    describe('Type Safety', () => {
        it('should maintain type safety with generic entity type', () => {
            expect(employeeTableSet.getEntityType()).toBe(Employee);
        });
    });
    describe('README Examples Compatibility', () => {
        it('should support the basic usage patterns from README', () => {
            expect(employeeTableSet.where).toBeDefined();
            expect(employeeTableSet.orderBy).toBeDefined();
            expect(employeeTableSet.select).toBeDefined();
        });
        it('should support relationship queries structure', () => {
            expect(context.orders.include).toBeDefined();
        });
        it('should support pagination structure', () => {
            expect(employeeTableSet.limit).toBeDefined();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFibGVTZXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlRhYmxlU2V0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sV0FBVyxDQUFDO0FBQ25DLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQ3JFLE9BQU8sUUFBUSxNQUFNLCtCQUErQixDQUFDO0FBQ3JELE9BQU8sUUFBUSxNQUFNLHFCQUFxQixDQUFDO0FBQzNDLE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBRS9DLE1BQU0sY0FBYyxHQUFHO0lBQ3JCLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxXQUFXO0lBQ3hDLElBQUksRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDO0lBQzdDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxhQUFhO0lBQzlDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxVQUFVO0lBQ3ZDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxVQUFVO0lBQy9DLEdBQUcsRUFBRSxFQUFFO0lBQ1AsaUJBQWlCLEVBQUUsS0FBSztJQUN4Qix1QkFBdUIsRUFBRSxJQUFJO0NBQzlCLENBQUM7QUFFRixLQUFLLFVBQVUsZ0JBQWdCLENBQUMsT0FBc0I7SUFDcEQsSUFBSSxDQUFDO1FBRUgsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQzs7Ozs7Ozs7S0FRekIsQ0FBQyxDQUFDO1FBR0gsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQzs7Ozs7Ozs7S0FRekIsQ0FBQyxDQUFDO1FBR0gsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FB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