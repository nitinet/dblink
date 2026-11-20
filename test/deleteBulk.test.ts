import PostgreSql from 'dblink-pg';
import { describe, expect, it, vi } from 'vitest';
import TableSet from '../src/collection/TableSet.js';
import * as decorators from '../src/decorators/index.js';
import Employee from './model/Employee.js';

@decorators.Table('line_items')
class LineItem {
  @decorators.Column('order_id')
  @decorators.Id
  orderId!: number;

  @decorators.Column('line_no')
  @decorators.Id
  lineNo!: number;
}

// No database needed: the context is stubbed, only the generated statement is inspected.
function stubbed<T extends object>(entity: new () => T) {
  const handler = new PostgreSql({ connectionString: 'postgres://unused/db' }); // pool connects lazily, never used here
  const runStatement = vi.fn();
  const table: TableSet<T> = new TableSet<T>(entity);
  table.context = { handler, runStatement } as never;
  const sqlOf = () => runStatement.mock.calls[0][0].eval(handler) as { query: string; args: unknown[] };
  return { table, runStatement, sqlOf };
}

describe('TableSet.deleteBulk', () => {
  it('issues ONE delete matching every row by primary key', async () => {
    const { table, runStatement, sqlOf } = stubbed(Employee);

    await table.deleteBulk([1, 2, 3].map(id => Object.assign(new Employee(), { id })));

    expect(runStatement).toHaveBeenCalledTimes(1);
    const { query, args } = sqlOf();
    expect(query).toBe('delete from employees where id in (?, ?, ?)');
    expect(args).toEqual([1, 2, 3]);
  });

  it('matches on every column of a composite primary key', async () => {
    const { table, sqlOf } = stubbed(LineItem);
    const item = (orderId: number, lineNo: number) => Object.assign(new LineItem(), { orderId, lineNo });

    await table.deleteBulk([item(1, 1), item(1, 2)]);

    const { query, args } = sqlOf();
    expect(query).toBe('delete from line_items where (order_id = ? and line_no = ?) or (order_id = ? and line_no = ?)');
    expect(args).toEqual([1, 1, 1, 2]);
  });

  it('does nothing for an empty batch', async () => {
    const { table, runStatement } = stubbed(Employee);
    await table.deleteBulk([]);
    expect(runStatement).not.toHaveBeenCalled();
  });
});
