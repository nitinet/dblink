import PostgreSql from 'dblink-pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Context from '../src/Context.js';
import TableSet from '../src/collection/TableSet.js';
import Order from './model/Order.js';
import TestDbContext from './TestDbContext.js';
import Employee from './model/Employee.js';
const TEST_DB_CONFIG = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'dblink_test',
    max: 5,
    idleTimeoutMillis: 5000
};
describe('Context', () => {
    let handler;
    let context;
    let testContext;
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
        context = new Context(handler);
        testContext = new TestDbContext(handler);
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
    describe('Constructor and Basic Functionality', () => {
        it('should be defined', () => {
            expect(Context).toBeDefined();
        });
        it('should create an instance with handler', () => {
            expect(context).toBeInstanceOf(Context);
            expect(context.handler).toBe(handler);
        });
        it('should create an instance with custom logger', () => {
            const customLogger = { log: vi.fn() };
            const contextWithLogger = new Context(handler, { logger: customLogger });
            expect(contextWithLogger).toBeInstanceOf(Context);
        });
        it('should use console as default logger', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            context.log('test message');
            expect(consoleSpy).toHaveBeenCalledWith('test message');
            consoleSpy.mockRestore();
        });
        it('should use custom logger when provided', () => {
            const customLogger = { log: vi.fn() };
            const contextWithLogger = new Context(handler, { logger: customLogger });
            contextWithLogger.log('test message');
            expect(customLogger.log).toHaveBeenCalledWith('test message');
        });
    });
    describe('Initialization', () => {
        it('should initialize handler and bind TableSets', async () => {
            await testContext.init();
            expect(testContext.employees.context).toBe(testContext);
            expect(testContext.orders.context).toBe(testContext);
        });
        it('should populate tableSetMap with entity mappings', async () => {
            await testContext.init();
            expect(testContext.tableSetMap.has(Employee)).toBe(true);
            expect(testContext.tableSetMap.has(Order)).toBe(true);
            expect(testContext.tableSetMap.get(Employee)).toBe(testContext.employees);
            expect(testContext.tableSetMap.get(Order)).toBe(testContext.orders);
        });
    });
    describe('Query Execution', () => {
        beforeEach(async () => {
            await context.init();
            await createTestTables();
        });
        it('should execute string queries', async () => {
            const query = 'SELECT 1 as test_value';
            const result = await context.run(query);
            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows[0].test_value).toBe(1);
        });
        it('should execute parameterized queries', async () => {
            await context.run(`INSERT INTO users (first_name, last_name, email) VALUES ('John', 'Doe', 'john@example.com')`);
            const result = await context.run(`SELECT * FROM users WHERE first_name = 'John'`);
            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].first_name).toBe('John');
            expect(result.rows[0].last_name).toBe('Doe');
            expect(result.rows[0].email).toBe('john@example.com');
        });
        it('should execute statement queries', async () => {
            const result = await context.run("SELECT 'Hello World'::text as message, 42::int as number");
            expect(result).toBeDefined();
            expect(result.rows).toBeDefined();
            expect(result.rows[0].message).toBe('Hello World');
            expect(result.rows[0].number).toBe(42);
        });
    });
    describe('Streaming', () => {
        beforeEach(async () => {
            await context.init();
            await createTestTables();
            for (let i = 1; i <= 100; i++) {
                await context.run(`INSERT INTO users (first_name, last_name, email) VALUES ('User${i}', 'Test', 'user${i}@example.com')`);
            }
        });
        it('should stream string queries', async () => {
            const query = 'SELECT * FROM users ORDER BY id';
            const stream = await context.stream(query);
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            let rowCount = 0;
            return new Promise((resolve, reject) => {
                stream.on('data', row => {
                    rowCount++;
                    expect(row).toBeDefined();
                    expect(row.first_name).toMatch(/^User\d+$/);
                });
                stream.on('end', () => {
                    expect(rowCount).toBe(100);
                    resolve(undefined);
                });
                stream.on('error', reject);
            });
        });
        it('should stream statement queries', async () => {
            const stream = await context.stream("SELECT * FROM users WHERE first_name LIKE 'User%' ORDER BY id");
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            let rowCount = 0;
            return new Promise((resolve, reject) => {
                stream.on('data', row => {
                    rowCount++;
                    expect(row).toBeDefined();
                    expect(row.first_name).toMatch(/^User\d+$/);
                });
                stream.on('end', () => {
                    expect(rowCount).toBe(100);
                    resolve(undefined);
                });
                stream.on('error', reject);
            });
        });
    });
    describe('Transaction Management', () => {
        beforeEach(async () => {
            await testContext.init();
            await createTestTables();
        });
        it('should initialize transaction and return cloned context', async () => {
            const transactionContext = await testContext.initTransaction();
            expect(transactionContext).toBeInstanceOf(TestDbContext);
            expect(transactionContext).not.toBe(testContext);
            expect(transactionContext.handler).toBeDefined();
        });
        it('should bind TableSets to transaction context', async () => {
            const transactionContext = await testContext.initTransaction();
            expect(transactionContext.employees.context).toBe(transactionContext);
            expect(transactionContext.orders.context).toBe(transactionContext);
            await transactionContext.rollback();
        });
        it('should commit transaction', async () => {
            const transactionContext = await testContext.initTransaction();
            await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxUser', 'Test', 'txuser@example.com')`);
            await transactionContext.commit();
            const result = await testContext.run(`SELECT * FROM users WHERE email = 'txuser@example.com'`);
            expect(result.rows.length).toBe(1);
            await testContext.run(`DELETE FROM users WHERE email = 'txuser@example.com'`);
        });
        it('should rollback transaction', async () => {
            const transactionContext = await testContext.initTransaction();
            await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('RollbackUser', 'Test', 'rollback@example.com')`);
            await transactionContext.rollback();
            const result = await testContext.run(`SELECT * FROM users WHERE email = 'rollback@example.com'`);
            expect(result.rows.length).toBe(0);
        });
        it('should throw error when committing without transaction', async () => {
            await expect(testContext.commit()).rejects.toThrow('Transaction Not Started');
        });
        it('should throw error when rolling back without transaction', async () => {
            await expect(testContext.rollback()).rejects.toThrow('Transaction Not Started');
        });
        it('should use transaction connection for queries in transaction context', async () => {
            const transactionContext = await testContext.initTransaction();
            await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxOnly', 'Test', 'txonly@example.com')`);
            const resultFromMain = await testContext.run(`SELECT * FROM users WHERE email = 'txonly@example.com'`);
            expect(resultFromMain.rows.length).toBe(0);
            const resultFromTx = await transactionContext.run(`SELECT * FROM users WHERE email = 'txonly@example.com'`);
            expect(resultFromTx.rows.length).toBe(1);
            await transactionContext.rollback();
        });
    });
    describe('TableSet Integration', () => {
        beforeEach(async () => {
            await testContext.init();
        });
        it('should contain properly configured TableSets', async () => {
            expect(testContext.employees).toBeInstanceOf(TableSet);
            expect(testContext.orders).toBeInstanceOf(TableSet);
            expect(testContext.employees.getEntityType()).toBe(Employee);
            expect(testContext.orders.getEntityType()).toBe(Order);
        });
        it('should have TableSets with correct table mappings', async () => {
            expect(testContext.employees.dbSet.tableName).toBe('employees');
            expect(testContext.orders.dbSet.tableName).toBe('orders');
        });
    });
    describe('Error Handling', () => {
        it('should handle query execution errors', async () => {
            await context.init();
            await expect(context.run('SELECT * FROM non_existent_table')).rejects.toThrow();
        });
        it('should handle invalid SQL syntax', async () => {
            await context.init();
            await expect(context.run('INVALID SQL QUERY')).rejects.toThrow();
        });
    });
    describe('Real-world Usage Scenarios', () => {
        beforeEach(async () => {
            await testContext.init();
            await createTestTables();
        });
        it('should support typical CRUD workflow', async () => {
            await testContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('John', 'Doe', 'john.doe@example.com')`);
            const userResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
            expect(userResult.rows.length).toBe(1);
            expect(userResult.rows[0].first_name).toBe('John');
            expect(userResult.rows[0].last_name).toBe('Doe');
            await testContext.run(`UPDATE users SET first_name = 'Jane' WHERE email = 'john.doe@example.com'`);
            const updatedResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
            expect(updatedResult.rows[0].first_name).toBe('Jane');
            await testContext.run(`DELETE FROM users WHERE email = 'john.doe@example.com'`);
            const deletedResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
            expect(deletedResult.rows.length).toBe(0);
        });
        it('should support streaming large datasets', async () => {
            for (let i = 1; i <= 10; i++) {
                await testContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('StreamUser${i}', 'Test', 'stream${i}@example.com')`);
            }
            const stream = await testContext.stream("SELECT * FROM users WHERE email LIKE 'stream%@example.com' ORDER BY id");
            expect(stream).toBeDefined();
            expect(stream.readable).toBe(true);
            let rowCount = 0;
            await new Promise((resolve, reject) => {
                stream.on('data', row => {
                    rowCount++;
                    expect(row.first_name).toMatch(/^StreamUser\d+$/);
                });
                stream.on('end', () => {
                    expect(rowCount).toBe(10);
                    resolve(undefined);
                });
                stream.on('error', reject);
            });
            await testContext.run(`DELETE FROM users WHERE email LIKE 'stream%@example.com'`);
        });
        it('should support complex transaction scenarios', async () => {
            const transactionContext = await testContext.initTransaction();
            try {
                await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxUser', 'Test', 'txuser@example.com')`);
                const userResult = await transactionContext.run(`SELECT id FROM users WHERE email = 'txuser@example.com'`);
                const userId = userResult.rows[0].id;
                await transactionContext.run(`INSERT INTO orders (user_id, total_amount) VALUES (${userId}, 99.99)`);
                await transactionContext.commit();
                const finalUserResult = await testContext.run(`SELECT * FROM users WHERE email = 'txuser@example.com'`);
                expect(finalUserResult.rows.length).toBe(1);
                const orderResult = await testContext.run(`SELECT * FROM orders WHERE user_id = ${userId}`);
                expect(orderResult.rows.length).toBe(1);
                expect(Number(orderResult.rows[0].total_amount)).toBe(99.99);
                await testContext.run(`DELETE FROM orders WHERE user_id = ${userId}`);
                await testContext.run(`DELETE FROM users WHERE email = 'txuser@example.com'`);
            }
            catch (error) {
                await transactionContext.rollback();
                throw error;
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGV4dC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29udGV4dC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sVUFBVSxNQUFNLFdBQVcsQ0FBQztBQUNuQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUM5RixPQUFPLE9BQU8sTUFBTSxtQkFBbUIsQ0FBQztBQUN4QyxPQUFPLFFBQVEsTUFBTSwrQkFBK0IsQ0FBQztBQUNyRCxPQUFPLEtBQUssTUFBTSxrQkFBa0IsQ0FBQztBQUNyQyxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLFFBQVEsTUFBTSxxQkFBcUIsQ0FBQztBQUczQyxNQUFNLGNBQWMsR0FBRztJQUNyQixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksV0FBVztJQUM3QyxJQUFJLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQztJQUNsRCxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksVUFBVTtJQUM1QyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxVQUFVO0lBQ3BELFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxhQUFhO0lBQ25ELEdBQUcsRUFBRSxDQUFDO0lBQ04saUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsSUFBSSxPQUFtQixDQUFDO0lBQ3hCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLFdBQTBCLENBQUM7SUFFL0IsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLE9B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