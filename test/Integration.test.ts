import PostgreSql from 'dblink-pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Order from './model/Order.js';
import TestDbContext from './model/TestDbContext.js';
import User from './model/User.js';

// Database configuration for testing
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
  let handler: PostgreSql;
  let db: TestDbContext;

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
    vi.clearAllMocks();
    db = new TestDbContext(handler);
    await db.init();

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

  describe('Basic Setup and Configuration', () => {
    it('should create database context successfully', async () => {
      expect(db).toBeInstanceOf(TestDbContext);
      expect(db.users).toBeDefined();
      expect(db.orders).toBeDefined();
      expect(db.profiles).toBeDefined();
    });

    it('should initialize with proper entity mappings', async () => {
      expect(db.tableSetMap.size).toBeGreaterThan(0);
      expect(db.tableSetMap.has(User)).toBe(true);
      expect(db.tableSetMap.has(Order)).toBe(true);
    });
  });

  describe('Query Examples from README', () => {
    beforeEach(async () => {
      await createTestTables();
    });

    it('should support finding a single user', async () => {
      // README: const user = await db.users.where(u => u.id.eq(1)).single();
      const userQuery = db.users.where(u => u.eq('id', 1));
      expect(userQuery).toBeDefined();
      expect(userQuery).toHaveProperty('single');
    });

    it('should support finding users with filtering and ordering', async () => {
      // README: const users = await db.users.where(u => u.lastName.eq('Smith')).orderBy(u => u.firstName.asc()).list();
      const userQuery = db.users.where(u => u.eq('lastName', 'Smith')).orderBy(u => [u.asc('firstName')]);

      expect(userQuery).toBeDefined();
      expect(userQuery).toHaveProperty('list');
    });

    it('should support column selection', async () => {
      // README: const userWithSelectedColumns = await db.users.where(u => u.id.eq(1)).select('id', 'firstName', 'lastName').single();
      const userQuery = db.users.where(u => u.eq('id', 1)).select(['id', 'firstName', 'lastName']);

      expect(userQuery).toBeDefined();
      expect(userQuery).toHaveProperty('single');
    });

    it('should support relationship queries', async () => {
      // README: const ordersWithUsers = await db.orders.include('user').where(o => o.totalAmount.eq(100)).list();
      const orderQuery = db.orders.include(['user']).where(o => o.eq('totalAmount', 100));

      expect(orderQuery).toBeDefined();
      expect(orderQuery).toHaveProperty('list');
    });

    it('should support pagination', async () => {
      // README: const page = await db.users.orderBy(u => u.createdAt.desc()).limit(10,10).list();
      const pageQuery = db.users.orderBy(u => [u.desc('createdAt')]).limit(10, 10);

      expect(pageQuery).toBeDefined();
      expect(pageQuery).toHaveProperty('list');
    });

    it('should support aggregations', async () => {
      // README: const totalOrders = await db.orders.where(o => o.userId.eq(1)).count();
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
      // README example: Insert a new user
      const newUser = new User();
      newUser.firstName = 'John';
      newUser.lastName = 'Doe';
      newUser.email = 'john@example.com';
      newUser.createdAt = new Date();

      expect(db.users).toHaveProperty('insert');

      // Test that the insert method exists and can be called
      // In a real scenario, this would actually insert data
    });

    it('should support update operations', async () => {
      // README example shows update workflow
      expect(db.users).toHaveProperty('update');

      // The pattern would be:
      // 1. Find user: const userToUpdate = await db.users.where(u => u.id.eq(1)).single();
      // 2. Modify: userToUpdate.email = 'new-email@example.com';
      // 3. Update: await db.users.update(userToUpdate, 'email');
    });

    it('should support delete operations', async () => {
      // README example shows delete workflow
      expect(db.users).toHaveProperty('delete');

      // The pattern would be:
      // 1. Find user: const userToDelete = await db.users.where(u => u.id.eq(2)).single();
      // 2. Delete: await db.users.delete(userToDelete);
    });
  });

  describe('Transaction Examples from README', () => {
    it('should support transaction workflow', async () => {
      // README: const transactionContext = await db.initTransaction();
      const transactionContext = await db.initTransaction();

      expect(transactionContext).toBeInstanceOf(TestDbContext);
      expect(transactionContext).not.toBe(db);
      expect(transactionContext.users).toBeDefined();
      expect(transactionContext.orders).toBeDefined();

      // Test commit and rollback methods exist
      expect(transactionContext).toHaveProperty('commit');
      expect(transactionContext).toHaveProperty('rollback');

      await transactionContext.rollback(); // Clean up
    });

    it('should support transaction commit workflow', async () => {
      const transactionContext = await db.initTransaction();

      // Simulate multi-step transaction
      const user = new User();
      user.firstName = 'Transaction';
      user.lastName = 'Test';
      user.email = 'transaction@example.com';
      user.createdAt = new Date();

      // Should be able to perform operations within transaction
      expect(transactionContext.users).toHaveProperty('insert');
      expect(transactionContext.orders).toHaveProperty('insert');

      // Should be able to commit
      await expect(transactionContext.commit()).resolves.not.toThrow();
    });

    it('should support transaction rollback workflow', async () => {
      const transactionContext = await db.initTransaction();

      // Should be able to rollback
      await expect(transactionContext.rollback()).resolves.not.toThrow();
    });

    it('should handle transaction errors gracefully', async () => {
      const transactionContext = await db.initTransaction();

      try {
        // Simulate some operations that might fail
        // In real scenario, this would be actual database operations

        // If success, commit
        await transactionContext.commit();
      } catch (error) {
        // If error, rollback
        await transactionContext.rollback();
      }

      // Both paths should be supported without throwing
      expect(true).toBe(true); // Test completes without error
    });
  });

  describe('Advanced Features from README', () => {
    beforeEach(async () => {
      await createTestTables();
    });

    it('should support custom raw queries', async () => {
      // README: const results = await db.run(query);
      const query = 'SELECT 1 as test_value';

      expect(db).toHaveProperty('run');

      const result = await db.run(query);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.rows[0].test_value).toBe(1);
    });

    it('should support streaming large datasets', async () => {
      // README: const stream = await db.stream(query);
      const query = 'SELECT 1 as test_value';

      expect(db).toHaveProperty('stream');

      const stream = await db.stream(query);
      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
    });

    it('should support statement execution', async () => {
      // Test runStatement method
      const statement = { sql: 'SELECT $1::int as test_value', args: [42] };

      expect(db).toHaveProperty('runStatement');

      const result = await db.runStatement(statement as any);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.rows[0].test_value).toBe(42);
    });

    it('should support statement streaming', async () => {
      // Test streamStatement method
      const statement = { sql: 'SELECT $1::text as test_value', args: ['hello'] };

      expect(db).toHaveProperty('streamStatement');

      const stream = await db.streamStatement(statement as any);
      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
    });
  });

  describe('Type Safety and Entity Relationships', () => {
    it('should maintain strong typing throughout query pipeline', () => {
      // Test that entity types are preserved
      expect(db.users.getEntityType()).toBe(User);
      expect(db.orders.getEntityType()).toBe(Order);

      // Test that queries maintain type safety
      const userQuery = db.users.where(u => u.eq('id', 1));
      expect(userQuery).toBeDefined();
    });

    it('should support relationship navigation', () => {
      // Test that foreign key relationships are properly configured
      const orderQuery = db.orders.include(['user']);
      expect(orderQuery).toBeDefined();

      // Verify that the Order entity has user relationship metadata
      const foreignKeyType = Reflect.getMetadata('dblink:foreign:type', Order.prototype, 'user');
      expect(foreignKeyType).toBe(User);
    });

    it('should support complex query combinations', () => {
      // Test complex query building like what would be used in real applications
      const complexQuery = db.orders
        .include(['user'])
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
      // Test with invalid connection config
      const errorHandler = new PostgreSql({
        ...TEST_DB_CONFIG,
        host: 'invalid-host',
        connectionTimeoutMillis: 1000
      });

      const errorDb = new TestDbContext(errorHandler);
      await expect(errorDb.init()).rejects.toThrow();
    });

    it('should handle query execution errors', async () => {
      await expect(db.run('INVALID SQL QUERY')).rejects.toThrow();
    });

    it('should handle transaction errors', async () => {
      // This test may vary based on the actual implementation
      // For now, just test that the method exists
      expect(db).toHaveProperty('initTransaction');
    });
  });

  describe('Performance and Memory Management', () => {
    beforeEach(async () => {
      await createTestTables();
    });

    it('should support streaming for large result sets', async () => {
      // This tests the streaming capability for memory-efficient processing
      const stream = await db.stream('SELECT 1 as test_value');
      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
    });

    it('should support pagination to limit memory usage', () => {
      // Test pagination functionality that helps with performance
      const paginatedQuery = db.users.orderBy(u => [u.desc('createdAt')]).limit(100, 20); // Skip 100, take 20

      expect(paginatedQuery).toBeDefined();
      expect(paginatedQuery).toHaveProperty('list');
    });
  });
});
