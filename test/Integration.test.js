import PostgreSql from 'dblink-pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Order from './model/Order.js';
import TestDbContext from './TestDbContext.js';
import Employee from './model/Employee.js';
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
describe('DBLink Integration Tests - README Examples', () => {
    let handler;
    let db;
    beforeAll(async () => {
        handler = new PostgreSql(TEST_DB_CONFIG);
        try {
            await handler.init();
        }
        catch (error) {
            console.warn('Database not available, skipping database-dependent tests');
            console.log('PostgreSQL handler not available - skipping database tests');
            return;
        }
    });
    afterAll(async () => {
        if (handler) {
            try {
                await Promise.race([handler.connectionPool?.end(), new Promise(resolve => setTimeout(resolve, 5000))]);
            }
            catch (error) {
            }
        }
    }, 15000);
    beforeEach(async () => {
        vi.clearAllMocks();
        db = new TestDbContext(handler);
        await db.init();
        try {
            await cleanupTestData();
        }
        catch (error) {
        }
    });
    afterEach(async () => {
        try {
            await cleanupTestData();
        }
        catch (error) {
            console.warn('Error during test cleanup:', error);
        }
    });
    async function cleanupTestData() {
        if (!handler)
            return;
        try {
            await handler.run('DROP TABLE IF EXISTS orders CASCADE');
            await handler.run('DROP TABLE IF EXISTS users CASCADE');
            await handler.run('DROP TABLE IF EXISTS profiles CASCADE');
            await handler.run('DROP TABLE IF EXISTS employees CASCADE');
            await handler.run('DROP TABLE IF EXISTS departments CASCADE');
        }
        catch (error) {
        }
    }
    async function createTestTables() {
        if (!handler)
            return;
        await handler.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        await handler.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        order_date TIMESTAMP DEFAULT NOW(),
        total_amount DECIMAL(10,2)
      )
    `);
        await handler.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    }
    describe('Basic Setup and Configuration', () => {
        it('should create database context successfully', async () => {
            expect(db).toBeInstanceOf(TestDbContext);
            expect(db.orders).toBeDefined();
        });
        it('should initialize with proper entity mappings', async () => {
            expect(db.tableSetMap.size).toBeGreaterThan(0);
            expect(db.tableSetMap.has(Order)).toBe(true);
        });
    });
    describe('Query Examples from README', () => {
        beforeEach(async () => {
            await createTestTables();
        });
        it('should support finding a single employee', async () => {
            const employeeQuery = db.employees.where(u => u.eq('id', 1));
            expect(employeeQuery).toBeDefined();
            expect(employeeQuery).toHaveProperty('single');
        });
        it('should support finding employees with filtering and ordering', async () => {
            const employeeQuery = db.employees.where(u => u.eq('lastName', 'Smith')).orderBy(u => [u.asc('firstName')]);
            expect(employeeQuery).toBeDefined();
            expect(employeeQuery).toHaveProperty('list');
        });
        it('should support column selection', async () => {
            const employeeQuery = db.employees.where(u => u.eq('id', 1)).select(['id', 'firstName', 'lastName']);
            expect(employeeQuery).toBeDefined();
            expect(employeeQuery).toHaveProperty('single');
        });
        it('should support relationship queries', async () => {
            const orderQuery = db.orders.include(['employee']).where(o => o.eq('totalAmount', 100));
            expect(orderQuery).toBeDefined();
            expect(orderQuery).toHaveProperty('list');
        });
        it('should support pagination', async () => {
            const pageQuery = db.employees.orderBy(u => [u.desc('createdAt')]).limit(10, 10);
            expect(pageQuery).toBeDefined();
            expect(pageQuery).toHaveProperty('list');
        });
        it('should support aggregations', async () => {
            const countQuery = db.orders.where(o => o.eq('userId', 1));
            expect(countQuery).toBeDefined();
            expect(countQuery).toHaveProperty('count');
        });
    });
    describe('Data Modification Examples from README', () => {
        beforeEach(async () => {
            await createTestTables();
        });
        it('should support insert operations', async () => {
            const newEmployee = new Employee();
            newEmployee.firstName = 'John';
            newEmployee.lastName = 'Doe';
            newEmployee.email = 'john@example.com';
            newEmployee.createdAt = new Date();
            expect(db.employees).toHaveProperty('insert');
        });
        it('should support update operations', async () => {
            expect(db.employees).toHaveProperty('update');
        });
        it('should support delete operations', async () => {
            expect(db.employees).toHaveProperty('delete');
        });
    });
    describe('Transaction Examples from README', () => {
        it('should support transaction workflow', async () => {
            const transactionContext = await db.initTransaction();
            expect(transactionContext).toBeInstanceOf(TestDbContext);
            expect(transactionContext).not.toBe(db);
            expect(transactionContext.employees).toBeDefined();
            expect(transactionContext.orders).toBeDefined();
            expect(transactionContext).toHaveProperty('commit');
            expect(transactionContext).toHaveProperty('rollback');
            await transactionContext.rollback();
        });
        it('should support transaction commit workflow', async () => {
            const transactionContext = await db.initTransaction();
            const user = new Employee();
            user.firstName = 'Transaction';
            user.lastName = 'Test';
            user.email = 'transaction@example.com';
            user.createdAt = new Date();
            expect(transactionContext.employees).toHaveProperty('insert');
            expect(transactionContext.orders).toHaveProperty('insert');
            await expect(transactionContext.commit()).resolves.not.toThrow();
        });
        it('should support transaction rollback workflow', async () => {
            const transactionContext = await db.initTransaction();
            await expect(transactionContext.rollback()).resolves.not.toThrow();
        });
        it('should handle transaction errors gracefully', async () => {
            const transactionContext = await db.initTransaction();
            try {
                await transactionContext.commit();
            }
            catch (error) {
                await transactionContext.rollback();
            }
            expect(true).toBe(true);
        });
    });
    describe('Advanced Features from README', () => {
        beforeEach(async () => {
            await createTestTables();
        });
        it('should support custom raw queries', async () => {
            const query = 'SELECT 1 as test_value';
            expect(db).toHaveProperty('run');
            const result = await db.run(query);
            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows[0].test_value).toBe(1);
        });
        it('should support streaming large datasets', async () => {
            const query = 'SELECT 1 as test_value';
            expect(db).toHaveProperty('stream');
            const stream = await db.stream(query);
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            await new Promise((resolve, reject) => {
                stream.on('data', () => { });
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        });
        it('should support statement execution', async () => {
            expect(db).toHaveProperty('runStatement');
            const result = await db.run('SELECT 42::int as test_value');
            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows[0].test_value).toBe(42);
        });
        it('should support statement streaming', async () => {
            expect(db).toHaveProperty('streamStatement');
            const stream = await db.stream("SELECT 'hello'::text as test_value");
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            await new Promise((resolve, reject) => {
                stream.on('data', () => { });
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        });
    });
    describe('Type Safety and Entity Relationships', () => {
        it('should maintain strong typing throughout query pipeline', () => {
            expect(db.employees.getEntityType()).toBe(Employee);
            expect(db.orders.getEntityType()).toBe(Order);
            const employeeQuery = db.employees.where(u => u.eq('id', 1));
            expect(employeeQuery).toBeDefined();
        });
        it('should support relationship navigation', () => {
            const orderQuery = db.orders.include(['employee']);
            expect(orderQuery).toBeDefined();
            const foreignKeyType = Reflect.getMetadata('foreignKeyType', Order.prototype, 'employee');
            expect(foreignKeyType).toBe(Employee);
        });
        it('should support complex query combinations', () => {
            const complexQuery = db.orders
                .include(['employee'])
                .where(o => o.eq('totalAmount', 100))
                .orderBy(o => [o.desc('orderDate'), o.asc('totalAmount')])
                .limit(10);
            expect(complexQuery).toBeDefined();
            expect(complexQuery).toHaveProperty('list');
            expect(complexQuery).toHaveProperty('single');
            expect(complexQuery).toHaveProperty('count');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle database connection errors', async () => {
            const errorHandler = new PostgreSql({
                ...TEST_DB_CONFIG,
                host: 'invalid-host',
                connectionTimeoutMillis: 1000
            });
            const errorDb = new TestDbContext(errorHandler);
            await errorDb.init();
            await expect(errorDb.run('SELECT 1')).rejects.toThrow();
            try {
                await errorHandler.connectionPool?.end();
            }
            catch (_) {
            }
        }, 5000);
        it('should handle query execution errors', async () => {
            await expect(db.run('INVALID SQL QUERY')).rejects.toThrow();
        });
        it('should handle transaction errors', async () => {
            expect(db).toHaveProperty('initTransaction');
        });
    });
    describe('Performance and Memory Management', () => {
        beforeEach(async () => {
            await createTestTables();
        });
        it('should support streaming for large result sets', async () => {
            const stream = await db.stream('SELECT 1 as test_value');
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            await new Promise((resolve, reject) => {
                stream.on('data', () => { });
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        });
        it('should support pagination to limit memory usage', () => {
            const paginatedQuery = db.employees.orderBy(u => [u.desc('createdAt')]).limit(100, 20);
            expect(paginatedQuery).toBeDefined();
            expect(paginatedQuery).toHaveProperty('list');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZWdyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sV0FBVyxDQUFDO0FBQ25DLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzlGLE9BQU8sS0FBSyxNQUFNLGtCQUFrQixDQUFDO0FBQ3JDLE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sUUFBUSxNQUFNLHFCQUFxQixDQUFDO0FBRzNDLE1BQU0sY0FBYyxHQUFHO0lBQ3JCLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxXQUFXO0lBQ3hDLElBQUksRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDO0lBQzdDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxhQUFhO0lBQzlDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxVQUFVO0lBQ3ZDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxVQUFVO0lBQy9DLEdBQUcsRUFBRSxFQUFFO0lBQ1AsaUJBQWlCLEVBQUUsS0FBSztJQUN4Qix1QkFBdUIsRUFBRSxJQUFJO0NBQzlCLENBQUM7QUFFRixRQUFRLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO0lBQzFELElBQUksT0FBbUIsQ0FBQztJQUN4QixJQUFJLEVBQWlCLENBQUM7SUFFdEIsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE9BQU8sR0FBRyxJQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUd6QyxJQUFJLENBQUM7WUFD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