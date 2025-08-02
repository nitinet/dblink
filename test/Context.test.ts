import PostgreSql from 'dblink-pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Context from '../src/Context.js';
import TableSet from '../src/collection/TableSet.js';
import Order from './model/Order.js';
import Profile from './model/Profile.js';
import TestDbContext from './model/TestDbContext.js';
import User from './model/User.js';

// Database configuration for testing
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'dblink_test',
  max: 5, // Reduced pool size for tests
  idleTimeoutMillis: 5000
};

describe('Context', () => {
  let handler: PostgreSql;
  let context: Context;
  let testContext: TestDbContext;

  beforeAll(async () => {
    handler = new PostgreSql(TEST_DB_CONFIG);

    // Test database connection
    try {
      await handler.init();
    } catch (error) {
      console.warn('Database not available, skipping database-dependent tests');
      console.log('PostgreSQL handler not available - skipping database tests');
      return;
    }
  });

  afterAll(async () => {
    if (handler) {
      try {
        // Close the connection pool
        await handler.connectionPool?.end();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  beforeEach(async () => {
    context = new Context(handler);
    testContext = new TestDbContext(handler);

    // Clean up any existing data
    try {
      await cleanupTestData();
    } catch (error) {
      // Ignore cleanup errors for fresh databases
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await cleanupTestData();
    } catch (error) {
      console.warn('Error during test cleanup:', error);
    }
  });

  async function cleanupTestData() {
    if (!handler) return;

    try {
      // Drop test tables if they exist
      await handler.run('DROP TABLE IF EXISTS orders CASCADE');
      await handler.run('DROP TABLE IF EXISTS users CASCADE');
      await handler.run('DROP TABLE IF EXISTS profiles CASCADE');
      await handler.run('DROP TABLE IF EXISTS employees CASCADE');
      await handler.run('DROP TABLE IF EXISTS departments CASCADE');
    } catch (error) {
      // Ignore errors if tables don't exist
    }
  }

  async function createTestTables() {
    if (!handler) return;

    // Create test tables matching our entity definitions
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

      expect(testContext.users.context).toBe(testContext);
      expect(testContext.orders.context).toBe(testContext);
      expect(testContext.profiles.context).toBe(testContext);
    });

    it('should populate tableSetMap with entity mappings', async () => {
      await testContext.init();

      expect(testContext.tableSetMap.has(User)).toBe(true);
      expect(testContext.tableSetMap.has(Order)).toBe(true);
      expect(testContext.tableSetMap.has(Profile)).toBe(true);
      expect(testContext.tableSetMap.get(User)).toBe(testContext.users);
      expect(testContext.tableSetMap.get(Order)).toBe(testContext.orders);
      expect(testContext.tableSetMap.get(Profile)).toBe(testContext.profiles);
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
      // Insert test data
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
      const statement = {
        sql: 'SELECT $1::text as message, $2::int as number',
        args: ['Hello World', 42]
      };
      const result = await context.runStatement(statement as any);

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

      // Insert some test data for streaming
      for (let i = 1; i <= 100; i++) {
        await context.run(`INSERT INTO users (first_name, last_name, email) VALUES ('User${i}', 'Test', 'user${i}@example.com')`);
      }
    });

    it('should stream string queries', async () => {
      const query = 'SELECT * FROM users ORDER BY id';
      const stream = await context.stream(query);

      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);

      // Test that we can read from the stream
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
      const statement = {
        sql: 'SELECT * FROM users WHERE first_name LIKE $1 ORDER BY id',
        args: ['User%']
      };
      const stream = await context.streamStatement(statement as any);

      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);

      // Test that we can read from the stream
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

      expect(transactionContext.users.context).toBe(transactionContext);
      expect(transactionContext.orders.context).toBe(transactionContext);
      expect(transactionContext.profiles.context).toBe(transactionContext);

      await transactionContext.rollback(); // Clean up
    });

    it('should commit transaction', async () => {
      const transactionContext = await testContext.initTransaction();

      // Insert test data in transaction
      await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxUser', 'Test', 'txuser@example.com')`);

      await transactionContext.commit();

      // Verify data was committed
      const result = await testContext.run(`SELECT * FROM users WHERE email = 'txuser@example.com'`);
      expect(result.rows.length).toBe(1);

      // Clean up
      await testContext.run(`DELETE FROM users WHERE email = 'txuser@example.com'`);
    });

    it('should rollback transaction', async () => {
      const transactionContext = await testContext.initTransaction();

      // Insert test data in transaction
      await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('RollbackUser', 'Test', 'rollback@example.com')`);

      await transactionContext.rollback();

      // Verify data was rolled back
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

      // Insert data in transaction - should not be visible outside transaction
      await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxOnly', 'Test', 'txonly@example.com')`);

      // Check from main context - should not see the data yet
      const resultFromMain = await testContext.run(`SELECT * FROM users WHERE email = 'txonly@example.com'`);
      expect(resultFromMain.rows.length).toBe(0);

      // Check from transaction context - should see the data
      const resultFromTx = await transactionContext.run(`SELECT * FROM users WHERE email = 'txonly@example.com'`);
      expect(resultFromTx.rows.length).toBe(1);

      await transactionContext.rollback(); // Clean up
    });
  });

  describe('TableSet Integration', () => {
    beforeEach(async () => {
      await testContext.init();
    });

    it('should contain properly configured TableSets', async () => {
      expect(testContext.users).toBeInstanceOf(TableSet);
      expect(testContext.orders).toBeInstanceOf(TableSet);
      expect(testContext.profiles).toBeInstanceOf(TableSet);

      expect(testContext.users.getEntityType()).toBe(User);
      expect(testContext.orders.getEntityType()).toBe(Order);
      expect(testContext.profiles.getEntityType()).toBe(Profile);
    });

    it('should have TableSets with correct table mappings', async () => {
      expect(testContext.users.dbSet.tableName).toBe('users');
      expect(testContext.orders.dbSet.tableName).toBe('orders');
      expect(testContext.profiles.dbSet.tableName).toBe('profiles');
    });
  });

  describe('Error Handling', () => {
    it('should handle query execution errors', async () => {
      await context.init();

      // Try to query a non-existent table
      await expect(context.run('SELECT * FROM non_existent_table')).rejects.toThrow();
    });

    it('should handle invalid SQL syntax', async () => {
      await context.init();

      // Try invalid SQL
      await expect(context.run('INVALID SQL QUERY')).rejects.toThrow();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    beforeEach(async () => {
      await testContext.init();
      await createTestTables();
    });

    it('should support typical CRUD workflow', async () => {
      // This test demonstrates the typical usage pattern from the README

      // Insert a user
      await testContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('John', 'Doe', 'john.doe@example.com')`);

      // Query the user
      const userResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].first_name).toBe('John');
      expect(userResult.rows[0].last_name).toBe('Doe');

      // Update the user
      await testContext.run(`UPDATE users SET first_name = 'Jane' WHERE email = 'john.doe@example.com'`);

      // Verify update
      const updatedResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
      expect(updatedResult.rows[0].first_name).toBe('Jane');

      // Delete the user
      await testContext.run(`DELETE FROM users WHERE email = 'john.doe@example.com'`);

      // Verify deletion
      const deletedResult = await testContext.run(`SELECT * FROM users WHERE email = 'john.doe@example.com'`);
      expect(deletedResult.rows.length).toBe(0);
    });

    it('should support streaming large datasets', async () => {
      // Insert multiple records
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

      // Clean up
      await testContext.run(`DELETE FROM users WHERE email LIKE 'stream%@example.com'`);
    });

    it('should support complex transaction scenarios', async () => {
      // Start transaction
      const transactionContext = await testContext.initTransaction();

      try {
        // Insert user in transaction
        await transactionContext.run(`INSERT INTO users (first_name, last_name, email) VALUES ('TxUser', 'Test', 'txuser@example.com')`);

        // Get the user ID
        const userResult = await transactionContext.run(`SELECT id FROM users WHERE email = 'txuser@example.com'`);
        const userId = userResult.rows[0].id;

        // Insert order for the user
        await transactionContext.run(`INSERT INTO orders (user_id, total_amount) VALUES (${userId}, 99.99)`);

        // Commit transaction
        await transactionContext.commit();

        // Verify both records exist outside transaction
        const finalUserResult = await testContext.run(`SELECT * FROM users WHERE email = 'txuser@example.com'`);
        expect(finalUserResult.rows.length).toBe(1);

        const orderResult = await testContext.run(`SELECT * FROM orders WHERE user_id = ${userId}`);
        expect(orderResult.rows.length).toBe(1);
        expect(Number(orderResult.rows[0].total_amount)).toBe(99.99);

        // Clean up
        await testContext.run(`DELETE FROM orders WHERE user_id = ${userId}`);
        await testContext.run(`DELETE FROM users WHERE email = 'txuser@example.com'`);
      } catch (error) {
        await transactionContext.rollback();
        throw error;
      }
    });
  });
});
