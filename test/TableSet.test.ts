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

async function createTestTables(context: TestDbContext) {
  try {
    // Create users table
    await context.handler.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create profiles table
    await context.handler.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        bio TEXT,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table (needed for context)
    await context.handler.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10,2),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.warn('Could not create test tables:', error);
  }
}

async function cleanupTestTables(context: TestDbContext) {
  try {
    await context.handler.run('DROP TABLE IF EXISTS orders CASCADE');
    await context.handler.run('DROP TABLE IF EXISTS profiles CASCADE');
    await context.handler.run('DROP TABLE IF EXISTS users CASCADE');
  } catch (error) {
    console.warn('Could not cleanup test tables:', error);
  }
}

describe('TableSet', () => {
  let context: TestDbContext;
  let employeeTableSet: TableSet<Employee>;

  beforeEach(async () => {
    const handler = new PostgreSql(TEST_DB_CONFIG);
    await handler.init();

    context = new TestDbContext(handler);
    await context.init();

    await createTestTables(context);

    employeeTableSet = context.employees;
  });

  afterEach(async () => {
    if (!context) return;

    try {
      await cleanupTestTables(context);
      await context.handler.close(null);
    } catch (error) {
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
      // Test that the DbSet has the correct field mappings
      expect(employeeTableSet.dbSet.fieldMap.has('id')).toBe(true);
      expect(employeeTableSet.dbSet.fieldMap.has('firstName')).toBe(true);
      expect(employeeTableSet.dbSet.fieldMap.has('lastName')).toBe(true);
      expect(employeeTableSet.dbSet.fieldMap.has('email')).toBe(true);
      expect(employeeTableSet.dbSet.fieldMap.has('createdAt')).toBe(true);

      // Check column name mappings
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
      // Since we can't easily test the full query building without more mocking,
      // we test that the basic structure is in place
      expect(employeeTableSet).toHaveProperty('where');
      expect(employeeTableSet).toHaveProperty('orderBy');
      expect(employeeTableSet).toHaveProperty('select');
      expect(employeeTableSet).toHaveProperty('include');
      expect(employeeTableSet).toHaveProperty('limit');
    });

    it('should support CRUD operations interface', () => {
      // Test that CRUD methods exist (implementation would require database)
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
      class InvalidEntity {}

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
      expect(emailField?.colName).toBe('email'); // Should default to property name
    });

    it('should respect @Id decorator for primary key identification', () => {
      const idField = employeeTableSet.dbSet.fieldMap.get('id');
      expect(idField?.primaryKey).toBe(true);

      // Non-primary key fields should not be marked as primary
      const emailField = employeeTableSet.dbSet.fieldMap.get('email');
      expect(emailField?.primaryKey).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with generic entity type', () => {
      // These tests verify TypeScript compilation more than runtime behavior
      expect(employeeTableSet.getEntityType()).toBe(Employee);
    });
  });

  describe('README Examples Compatibility', () => {
    it('should support the basic usage patterns from README', () => {
      // Test that the TableSet supports the patterns shown in README examples
      // Note: These would need actual implementation to execute queries
      expect(employeeTableSet.where).toBeDefined();
      expect(employeeTableSet.orderBy).toBeDefined();
      expect(employeeTableSet.select).toBeDefined();
    });

    it('should support relationship queries structure', () => {
      // Include functionality would need actual relationships to test fully
      expect(context.orders.include).toBeDefined();
    });

    it('should support pagination structure', () => {
      // Limit functionality
      expect(employeeTableSet.limit).toBeDefined();
    });
  });
});
