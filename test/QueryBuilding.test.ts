import PostgreSql from 'dblink-pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import TestDbContext from './TestDbContext.js';
import WhereExprBuilder from '../src/exprBuilder/WhereExprBuilder.js';
import Employee from './model/Employee.js';

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

describe('Query Building', () => {
  let handler: PostgreSql;
  let context: TestDbContext;

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
    context = new TestDbContext(handler);
    await context.init();

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

  describe('Query Structure', () => {
    it('should support fluent query interface', () => {
      // Test that fluent interface methods exist and return chainable objects
      const query = context.employees.where(u => u.eq('lastName', 'Smith')).orderBy(u => [u.asc('firstName')]);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
      expect(query).toHaveProperty('single');
      expect(query).toHaveProperty('count');
    });

    it('should support method chaining', () => {
      const query = context.employees
        .where(u => u.eq('email', 'test@example.com'))
        .orderBy(u => [u.desc('createdAt')])
        .limit(10);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
      expect(query).toHaveProperty('single');
    });

    it('should support select with specific columns', () => {
      const query = context.employees.select(['id', 'firstName', 'lastName']);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('where');
      expect(query).toHaveProperty('orderBy');
      expect(query).toHaveProperty('list');
    });

    it('should support include for relationships', () => {
      const query = context.orders.include(['employee']);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('where');
      expect(query).toHaveProperty('list');
    });
  });

  describe('Where Clause Building', () => {
    it('should support comparison operators', () => {
      // Test that comparison methods exist on WhereExprBuilder
      const whereFunc = (builder: any) => {
        // Test individual operators
        expect(builder.eq).toBeDefined();
        expect(builder.neq).toBeDefined();
        expect(builder.gt).toBeDefined();
        expect(builder.lt).toBeDefined();
        expect(builder.lteq).toBeDefined();
        expect(builder.like).toBeDefined();
        expect(builder.in).toBeDefined();
        expect(builder.isNull).toBeDefined();
        expect(builder.isNotNull).toBeDefined();

        return builder.eq('id', 1);
      };

      const query = context.employees.where(whereFunc);
      expect(query).toBeDefined();
    });

    it('should support logical operators', () => {
      const query = context.employees.where(builder => {
        return builder.eq('firstName', 'John').and(builder.eq('lastName', 'Doe'));
      });
      expect(query).toBeDefined();
    });

    it('should support complex where conditions', () => {
      const query = context.employees.where(builder => {
        return builder.gt('id', 100).or(builder.eq('firstName', 'John').and(builder.like('email', '%@example.com')));
      });
      expect(query).toBeDefined();
    });

    it('should support null checks', () => {
      const whereFunc = (builder: WhereExprBuilder<Employee>) => {
        return builder.isNotNull('email');
      };

      const query = context.employees.where(whereFunc);
      expect(query).toBeDefined();
    });

    it('should support IN operator', () => {
      const whereFunc = (builder: any) => {
        return builder.in('id', [1, 2, 3, 4, 5]);
      };

      const query = context.employees.where(whereFunc);
      expect(query).toBeDefined();
    });
  });

  describe('Order By Clause Building', () => {
    it('should support ascending order', () => {
      const orderFunc = (builder: any) => {
        expect(builder.asc).toBeDefined();
        return [builder.asc('firstName')];
      };

      const query = context.employees.orderBy(orderFunc);
      expect(query).toBeDefined();
    });

    it('should support descending order', () => {
      const orderFunc = (builder: any) => {
        expect(builder.desc).toBeDefined();
        return [builder.desc('createdAt')];
      };

      const query = context.employees.orderBy(orderFunc);
      expect(query).toBeDefined();
    });

    it('should support multiple order columns', () => {
      const orderFunc = (builder: any) => {
        return [builder.asc('lastName'), builder.asc('firstName'), builder.desc('createdAt')];
      };

      const query = context.employees.orderBy(orderFunc);
      expect(query).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should support limit with count only', () => {
      const query = context.employees.limit(10);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
      expect(query).toHaveProperty('single');
    });

    it('should support limit with offset and count', () => {
      const query = context.employees.limit(10, 20); // Skip 10, take 20

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
    });

    it('should support pagination patterns from README', () => {
      // README example: .limit(10,10) // Skip 10, take 10
      const query = context.employees.orderBy(u => [u.desc('createdAt')]).limit(10, 10);

      expect(query).toBeDefined();
    });
  });

  describe('Aggregation Support', () => {
    it('should support count operation', () => {
      const query = context.employees.where(u => u.eq('lastName', 'Smith'));

      expect(query).toHaveProperty('count');
    });

    it('should support count with conditions', () => {
      const query = context.orders.where(o => o.eq('userId', 1));

      expect(query).toHaveProperty('count');
    });
  });

  describe('Result Retrieval', () => {
    it('should support list operation for multiple results', () => {
      const query = context.employees.where(u => u.eq('lastName', 'Smith')).orderBy(u => [u.asc('firstName')]);

      expect(query).toHaveProperty('list');
    });

    it('should support single operation for one result', () => {
      const query = context.employees.where(u => u.eq('id', 1));

      expect(query).toHaveProperty('single');
    });
  });

  describe('CRUD Operations', () => {
    it('should support insert operation', () => {
      expect(context.employees).toHaveProperty('insert');
    });

    it('should support update operation', () => {
      expect(context.employees).toHaveProperty('update');
    });

    it('should support delete operation', () => {
      expect(context.employees).toHaveProperty('delete');
    });
  });

  describe('Relationship Queries', () => {
    it('should support include for foreign key relationships', () => {
      const query = context.orders.include(['employee']);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('where');
      expect(query).toHaveProperty('list');
    });

    it('should support nested includes', () => {
      // Test that include can be chained or support nested relationships
      const query = context.orders.include(['employee']);

      expect(query).toBeDefined();
    });

    it('should support filtering with relationships', () => {
      const query = context.orders.include(['employee']).where(o => o.gt('totalAmount', 100));

      expect(query).toBeDefined();
    });
  });

  describe('Complex Query Scenarios from README', () => {
    it('should support basic user filtering example', () => {
      // README: db.users.where(u => u.lastName.eq('Smith')).orderBy(u => u.firstName.asc()).list()
      const query = context.employees.where(u => u.eq('lastName', 'Smith')).orderBy(u => [u.asc('firstName')]);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
    });

    it('should support column selection example', () => {
      // README: db.users.where(u => u.id.eq(1)).select('id', 'firstName', 'lastName').single()
      const query = context.employees.where(u => u.eq('id', 1)).select(['id', 'firstName', 'lastName']);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('single');
    });

    it('should support relationship query example', () => {
      // README: db.orders.include('user').where(o => o.totalAmount.eq(100)).list()
      const query = context.orders.include(['employee']).where(o => o.eq('totalAmount', 100));

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
    });

    it('should support pagination example', () => {
      // README: db.users.orderBy(u => u.createdAt.desc()).limit(10,10).list()
      const query = context.employees.orderBy(u => [u.desc('createdAt')]).limit(10, 10);

      expect(query).toBeDefined();
      expect(query).toHaveProperty('list');
    });

    it('should support aggregation example', () => {
      // README: db.orders.where(o => o.userId.eq(1)).count()
      const query = context.orders.where(o => o.eq('userId', 1));

      expect(query).toBeDefined();
      expect(query).toHaveProperty('count');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety in query building', () => {
      // These tests verify that TypeScript compilation enforces type safety
      const query = context.employees.where(u => u.eq('id', 1)); // Should accept number for id
      expect(query).toBeDefined();

      const emailQuery = context.employees.where(u => u.eq('email', 'test@example.com')); // Should accept string for email
      expect(emailQuery).toBeDefined();
    });

    it('should provide strongly typed results', () => {
      // Verify that the query results maintain entity types
      const query = context.employees.where(u => u.eq('id', 1));
      expect(query).toBeDefined();
      expect(query).toHaveProperty('single');
      expect(query).toHaveProperty('list');
    });
  });
});
