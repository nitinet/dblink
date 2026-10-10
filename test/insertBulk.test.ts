import PostgreSql from 'dblink-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import TableSet from '../src/collection/TableSet.js';
import Employee from './model/Employee.js';
import TestDbContext from './TestDbContext.js';

// No database needed: the context is stubbed, only the generated statement is inspected.
describe('TableSet.insertBulk', () => {
  it('issues one multi-row INSERT, binding values per row and using default for nulls', async () => {
    const handler = new PostgreSql({ connectionString: 'postgres://unused/db' }); // pool connects lazily, never used here
    const runStatement = vi.fn();
    const table = new TableSet(Employee);
    table.context = { handler, runStatement } as never;

    const rows = ['a', 'b'].map((n, i) => Object.assign(new Employee(), { id: i + 1, firstName: n, email: `${n}@x.com`, ...(i ? { lastName: 'z' } : {}) }));
    await table.insertBulk(rows);

    expect(runStatement).toHaveBeenCalledTimes(1);
    const { query, args } = runStatement.mock.calls[0][0].eval(handler);
    expect(query).toMatch(/^insert into \S+ \(.+\) values \(.+\), \(.+\)$/);
    expect(query.match(/default/g)?.length).toBeGreaterThan(0);
    expect(args).toEqual(expect.arrayContaining([1, 2, 'a', 'b', 'a@x.com', 'b@x.com']));
    expect(args.indexOf('a')).toBeLessThan(args.indexOf('b'));
  });

  it('leaves out a column that is null in every row', async () => {
    const handler = new PostgreSql({ connectionString: 'postgres://unused/db' });
    const runStatement = vi.fn();
    const table = new TableSet(Employee);
    table.context = { handler, runStatement } as never;
    await table.insertBulk([1, 2].map(id => Object.assign(new Employee(), { id, firstName: 'a' })));
    const { query } = runStatement.mock.calls[0][0].eval(handler);
    expect(query).toContain('first_name');
    expect(query).not.toMatch(/last_name|email|created_at|department_id|default/);
  });

  it('rejects a batch with no values at all', async () => {
    const table = new TableSet(Employee);
    table.context = { runStatement: vi.fn() } as never;
    await expect(table.insertBulk([new Employee()])).rejects.toThrow('No column values');
  });

  it('does nothing for an empty batch', async () => {
    const runStatement = vi.fn();
    const table = new TableSet(Employee);
    table.context = { runStatement } as never;
    await table.insertBulk([]);
    expect(runStatement).not.toHaveBeenCalled();
  });
});

// Live PostgreSQL checks for insertBulk (skipped when no DB).
const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dblink_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  connectionTimeoutMillis: 2000
};

let dbAvailable = false;
{
  const probe = new PostgreSql(cfg);
  try {
    await probe.init();
    await probe.run('select 1');
    dbAvailable = true;
  } catch {
    /* no db */
  } finally {
    await probe.connectionPool?.end().catch(() => undefined);
  }
}

const emp = (first: string, extra: Partial<Employee> = {}) =>
  Object.assign(new Employee(), { firstName: first, lastName: 'L', email: `${first}@x.com`, createdAt: new Date(), ...extra });

describe.skipIf(!dbAvailable)('insertBulk (live PostgreSQL)', () => {
  let handler: PostgreSql;
  let db: TestDbContext;

  beforeAll(async () => {
    handler = new PostgreSql(cfg);
    await handler.init();
  });
  afterAll(async () => {
    await handler?.run('DROP TABLE IF EXISTS employees CASCADE').catch(() => undefined);
    await handler?.connectionPool?.end().catch(() => undefined);
  });
  beforeEach(async () => {
    await handler.run('DROP TABLE IF EXISTS employees CASCADE');
    await handler.run(`CREATE TABLE employees (id SERIAL PRIMARY KEY, first_name VARCHAR(255), last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE, created_at TIMESTAMP DEFAULT NOW(), department_id INTEGER)`);
    db = new TestDbContext(handler);
    await db.init();
  });

  it('inserts many rows in one statement with serial ids and column defaults', async () => {
    await db.employees.insertBulk([emp('a'), emp('b', { createdAt: undefined }), emp('c')]);
    const rows = await db.employees.list();
    expect(rows.map(r => r.firstName).sort()).toEqual(['a', 'b', 'c']);
    expect(new Set(rows.map(r => r.id)).size).toBe(3);
    expect(rows.every(r => r.createdAt instanceof Date)).toBe(true); // null createdAt -> DB default NOW()
  });

  it('inserts a single row', async () => {
    await db.employees.insertBulk([emp('solo')]);
    expect(await db.employees.count()).toBe(1);
  });

  it('is atomic: a unique violation in one row inserts none', async () => {
    await expect(db.employees.insertBulk([emp('a'), emp('b', { email: 'a@x.com' })])).rejects.toThrow();
    expect(await db.employees.count()).toBe(0);
  });

  it('treats values as bound params, not SQL (quotes, ?, injection strings)', async () => {
    const evil = "x'); DROP TABLE employees; -- ?";
    await db.employees.insertBulk([emp(evil), emp('o\'brien')]);
    const names = (await db.employees.list()).map(r => r.firstName).sort();
    expect(names).toEqual([evil, "o'brien"].sort());
  });

  it('joins a transaction and rolls back with it', async () => {
    const tx = await db.initTransaction();
    await tx.employees.insertBulk([emp('t1'), emp('t2')]);
    await tx.rollback();
    expect(await db.employees.count()).toBe(0);
  });

  it('commits inside a transaction', async () => {
    const tx = await db.initTransaction();
    await tx.employees.insertBulk([emp('t1'), emp('t2')]);
    await tx.commit();
    expect(await db.employees.count()).toBe(2);
  });

  it('handles a large batch (1000 rows x 7 cols = 7000 params)', async () => {
    await db.employees.insertBulk(Array.from({ length: 1000 }, (_, i) => emp(`n${i}`)));
    expect(await db.employees.count()).toBe(1000);
  });

  it('fails clearly past the 65535 bind-param cap (documented ceiling)', async () => {
    await expect(db.employees.insertBulk(Array.from({ length: 20000 }, (_, i) => emp(`m${i}`)))).rejects.toThrow();
    expect(await db.employees.count()).toBe(0);
  }, 30000);
});
