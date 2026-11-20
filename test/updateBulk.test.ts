import PostgreSql from 'dblink-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import TableSet from '../src/collection/TableSet.js';
import * as decorators from '../src/decorators/index.js';
import Employee from './model/Employee.js';
import TestDbContext from './TestDbContext.js';

@decorators.Table('line_items')
class LineItem {
  @decorators.Column('order_id')
  @decorators.Id
  orderId!: number;

  @decorators.Column('line_no')
  @decorators.Id
  lineNo!: number;

  @decorators.Column()
  qty!: number;

  @decorators.Column()
  note!: string;
}

const emp = (id: number, firstName: string, lastName = 'L') => Object.assign(new Employee(), { id, firstName, lastName });

// No database needed: the context is stubbed, only the generated statement is inspected.
function stubbed<T extends object>(entity: new () => T) {
  const handler = new PostgreSql({ connectionString: 'postgres://unused/db' }); // pool connects lazily, never used here
  const runStatement = vi.fn();
  const table: TableSet<T> = new TableSet<T>(entity);
  table.context = { handler, runStatement } as never;
  const sqlOf = () => runStatement.mock.calls[0][0].eval(handler) as { query: string; args: unknown[] };
  return { table, runStatement, sqlOf };
}

describe('TableSet.updateBulk', () => {
  it('issues ONE update with a case per column, matching rows by primary key', async () => {
    const { table, runStatement, sqlOf } = stubbed(Employee);

    await table.updateBulk([emp(1, 'a'), emp(2, 'b')], 'firstName');

    expect(runStatement).toHaveBeenCalledTimes(1);
    const { query, args } = sqlOf();
    expect(query).toMatch(/^update employees set first_name = case when id = \? then \? when id = \? then \? else first_name end where id in \(\?, \?\)$/);
    expect(args).toEqual([1, 'a', 2, 'b', 1, 2]);
  });

  it('sets several columns, each with its own case, args in the order they appear', async () => {
    const { table, sqlOf } = stubbed(Employee);

    await table.updateBulk([emp(1, 'a', 'x'), emp(2, 'b', 'y')], 'firstName', 'lastName');

    const { query, args } = sqlOf();
    expect(query).toContain('first_name = case when id = ? then ? when id = ? then ? else first_name end, last_name = case when id = ? then ? when id = ? then ? else last_name end');
    expect(args).toEqual([1, 'a', 2, 'b', 1, 'x', 2, 'y', 1, 2]);
  });

  it('keeps the last value when the same row appears twice, as sequential updates did', async () => {
    const { table, sqlOf } = stubbed(Employee);

    await table.updateBulk([emp(1, 'first'), emp(2, 'b'), emp(1, 'last')], 'firstName');

    const { args } = sqlOf();
    // the repeated row keeps its first position and its last value
    expect(args).toEqual([1, 'last', 2, 'b', 1, 2]);
  });

  it('matches on every column of a composite primary key', async () => {
    const { table, sqlOf } = stubbed(LineItem);
    const item = (orderId: number, lineNo: number, qty: number) => Object.assign(new LineItem(), { orderId, lineNo, qty });

    await table.updateBulk([item(1, 1, 5), item(1, 2, 6)], 'qty');

    const { query, args } = sqlOf();
    expect(query).toContain('qty = case when order_id = ? and line_no = ? then ? when order_id = ? and line_no = ? then ? else qty end');
    expect(query).toContain('where (order_id = ? and line_no = ?) or (order_id = ? and line_no = ?)');
    expect(args).toEqual([1, 1, 5, 1, 2, 6, 1, 1, 1, 2]);
  });

  it('binds values as parameters, never into the SQL text', async () => {
    const { table, sqlOf } = stubbed(Employee);
    const evil = "x'); drop table employees; -- ?";

    await table.updateBulk([emp(1, evil)], 'firstName');

    const { query, args } = sqlOf();
    expect(query).not.toContain('drop table');
    expect(args).toContain(evil);
  });

  it('does nothing for an empty batch', async () => {
    const { table, runStatement } = stubbed(Employee);
    await table.updateBulk([], 'firstName');
    expect(runStatement).not.toHaveBeenCalled();
  });

  it('updates every non-key column when none are named', async () => {
    const { table, sqlOf } = stubbed(Employee);

    await table.updateBulk([emp(1, 'a', 'x')]);

    const { query } = sqlOf();
    expect(query).toContain('first_name = case when id = ? then ? else first_name end');
    expect(query).toContain('last_name = case when id = ? then ? else last_name end');
    expect(query).not.toMatch(/set id = |, id = /);
  });
});

// Live PostgreSQL checks for updateBulk (skipped when no DB).
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

describe.skipIf(!dbAvailable)('updateBulk (live PostgreSQL)', () => {
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
    await db.employees.insertBulk([1, 2, 3, 4].map(n => Object.assign(new Employee(), { firstName: `n${n}`, lastName: 'L', email: `n${n}@x.com`, createdAt: new Date() })));
  });

  it('gives each row its own value in one statement and leaves the rest untouched', async () => {
    const rows = await db.employees.orderBy(a => [a.asc('id')]).list();
    rows[0].firstName = 'one';
    rows[1].firstName = 'two';
    rows[2].firstName = "o'three";

    await db.employees.updateBulk(rows.slice(0, 3), 'firstName');

    const after = await db.employees.orderBy(a => [a.asc('id')]).list();
    expect(after.map(r => r.firstName)).toEqual(['one', 'two', "o'three", 'n4']);
    expect(after.every(r => r.lastName === 'L')).toBe(true);
  });

  it('writes a null and a typed (integer) column', async () => {
    const rows = await db.employees.orderBy(a => [a.asc('id')]).list();
    rows[0].lastName = null as never;
    rows[0].departmentId = 7;
    rows[1].departmentId = 9;

    await db.employees.updateBulk(rows.slice(0, 2), 'lastName', 'departmentId');

    const after = await db.employees.orderBy(a => [a.asc('id')]).list();
    expect([after[0].lastName, after[0].departmentId, after[1].departmentId]).toEqual([null, 7, 9]);
  });

  it('joins a transaction and rolls back with it', async () => {
    const tx = await db.initTransaction();
    const rows = await tx.employees.orderBy(a => [a.asc('id')]).list();
    rows.forEach(r => (r.firstName = 'changed'));
    await tx.employees.updateBulk(rows, 'firstName');
    await tx.rollback();

    expect((await db.employees.orderBy(a => [a.asc('id')]).list()).map(r => r.firstName)).toEqual(['n1', 'n2', 'n3', 'n4']);
  });
});
