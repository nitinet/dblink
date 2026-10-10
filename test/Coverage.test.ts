import PostgreSql from 'dblink-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import * as sql from 'dblink-core/src/sql/index.js';
import Context from '../src/Context.js';
import TableSet from '../src/collection/TableSet.js';
import WhereExprBuilder from '../src/exprBuilder/WhereExprBuilder.js';
import GroupExprBuilder from '../src/exprBuilder/GroupExprBuilder.js';
import FieldMapping from '../src/exprBuilder/FieldMapping.js';
import Column from '../src/decorators/Column.js';
import * as decorators from '../src/decorators/index.js';
import Employee from './model/Employee.js';
import Department from './model/Department.js';
import Order from './model/Order.js';

/**
 * Focused coverage suite.
 *
 * The existing Integration/Context/QueryBuilding suites cover the common paths;
 * this file targets the remaining branches — every WhereExprBuilder operator,
 * the expression-builder guard clauses, and the QuerySet/TableSet/JoinQuerySet
 * execution paths (listAndCount, stream, groupBy, per-row update/delete, bulk,
 * composite keys, eager-loaded collections) exercised against live PostgreSQL.
 */

// ---------------------------------------------------------------------------
// Extra entities used only here to reach otherwise-unhit branches.
// ---------------------------------------------------------------------------

// No primary key -> exercises the "primary key not found" guards.
@decorators.Table('coverage_nokey')
class NoKeyItem {
  @decorators.Column()
  name!: string;
}

// Composite primary key -> exercises the multi-column insertAndFetch path.
@decorators.Table('coverage_composite')
class CompositeItem {
  @decorators.Column('part_a')
  @decorators.Id
  partA!: number;

  @decorators.Column('part_b')
  @decorators.Id
  partB!: number;

  @decorators.Column()
  label!: string;
}

// One-to-many foreign relation (an array property) -> exercises the
// `propertyType === Array` branch of QuerySet.transformer.
@decorators.Table('coverage_member')
class Member {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column()
  name!: string;

  @decorators.Column('team_id')
  teamId!: number;
}

@decorators.Table('coverage_team')
class Team {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column()
  name!: string;

  @decorators.Foreign(Member, (builder, parent) => builder.eq('teamId', (parent as Team).id))
  members!: Member[];
}

class CoverageContext extends Context {
  employees = new TableSet(Employee);
  departments = new TableSet(Department);
  orders = new TableSet(Order);
  nokeys = new TableSet(NoKeyItem);
  composites = new TableSet(CompositeItem);
  teams = new TableSet(Team);
  members = new TableSet(Member);
}

// ---------------------------------------------------------------------------
// Pure unit tests (no database required).
// ---------------------------------------------------------------------------

describe('Expression builders (unit)', () => {
  const fieldColumnMap = new Map<string, string>([
    ['id', 'id'],
    ['name', 'name']
  ]);

  const eb = () => new WhereExprBuilder<{ id: number; name: string }>(fieldColumnMap as Map<'id' | 'name', string>);

  it('maps every WhereExprBuilder operator to the right SQL operator', () => {
    const cases: Array<[sql.Expression, Operator]> = [
      [eb().neq('id', 1), Operator.NotEqual],
      [eb().lt('id', 1), Operator.LessThan],
      [eb().gt('id', 1), Operator.GreaterThan],
      [eb().lteq('id', 1), Operator.LessThanEqual],
      [eb().gteq('id', 1), Operator.GreaterThanEqual],
      [eb().between('id', 1, 9), Operator.Between],
      [eb().like('name', '%a%'), Operator.Like],
      [eb().isNull('name'), Operator.IsNull],
      [eb().isNotNull('name'), Operator.IsNotNull],
      [eb().plus('id', 1), Operator.Plus],
      [eb().minus('id', 1), Operator.Minus],
      [eb().multiply('id', 2), Operator.Multiply],
      [eb().devide('id', 2), Operator.Devide],
      [eb().sum('id'), Operator.Sum],
      [eb().min('id'), Operator.Min],
      [eb().max('id'), Operator.Max],
      [eb().count('id'), Operator.Count],
      [eb().average('id'), Operator.Avg],
      [eb().contains('id', 1), Operator.Contains],
      [eb().containedBy('id', 1), Operator.ContainedBy],
      [eb().overlap('id', 1), Operator.Overlap]
    ];

    for (const [expr, op] of cases) {
      expect(expr).toBeInstanceOf(sql.Expression);
      expect(expr.operator).toBe(op);
    }
  });

  it('passes through an Expression operand without wrapping it', () => {
    const inner = eb().eq('id', 1);
    const expr = eb().eq('id', inner);
    // The operand Expression should be reused as-is (no extra '?' placeholder).
    expect(expr.exps).toContain(inner);
  });

  it('in() builds one placeholder per value', () => {
    const expr = eb().in('id', 1, 2, 3);
    expect(expr.operator).toBe(Operator.In);
    // first exp is the column, the rest are the value placeholders
    expect(expr.exps).toHaveLength(4);
  });

  it('GroupExprBuilder.expr resolves a column expression', () => {
    const gb = new GroupExprBuilder<{ id: number; name: string }>(fieldColumnMap as Map<'id' | 'name', string>);
    const expr = gb.expr('name');
    expect(expr).toBeInstanceOf(sql.Expression);
    expect(expr.value).toBe('name');
  });

  it('throws when a property has no column mapping', () => {
    const bad = new WhereExprBuilder<{ id: number; name: string }>(new Map());
    expect(() => bad.eq('id', 1)).toThrow('Field Not Found');
  });

  it('qualifies columns with the table alias when provided', () => {
    const aliased = new WhereExprBuilder<{ id: number; name: string }>(fieldColumnMap as Map<'id' | 'name', string>, 't');
    expect(aliased.col('name').value).toBe('t.name');
  });

  it('FieldMapping defaults primaryKey to false when omitted', () => {
    const fm = new FieldMapping('name', 'name', String as never, undefined as never);
    expect(fm.primaryKey).toBe(false);
  });

  it('Column throws on a duplicate column registration', () => {
    class Dummy {}
    Column('a')(Dummy.prototype, 'prop');
    expect(() => Column('b')(Dummy.prototype, 'prop')).toThrow('Duplicate column name');
  });

  it('insertAndFetch falls back to a key lookup when the insert returns no row', async () => {
    // A live pg INSERT ... RETURNING always yields exactly one row, so the
    // fallback branch is only reachable with a driver that returns none. A stub
    // context reproduces that: the insert reports zero rows, so it re-reads the
    // entity by its primary key (which also finds nothing and throws).
    const ts = new TableSet(Employee);
    const stubContext = {
      handler: { serializeValue: (v: unknown) => v },
      runStatement: async () => ({ rows: [] })
    };
    (ts as unknown as { context: unknown }).context = stubContext;

    const emp = new Employee();
    emp.id = 42;
    emp.email = 'stub@example.com';

    await expect(ts.insertAndFetch(emp)).rejects.toThrow('Value Not Found');
  });
});

// ---------------------------------------------------------------------------
// Live-database execution paths.
// ---------------------------------------------------------------------------

const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dblink_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000
};

let dbAvailable = false;
{
  const probe = new PostgreSql(TEST_DB_CONFIG);
  try {
    await probe.init();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  } finally {
    try {
      await probe.connectionPool?.end();
    } catch {
      /* ignore */
    }
  }
}

async function createSchema(handler: PostgreSql) {
  await handler.run('DROP TABLE IF EXISTS orders CASCADE');
  await handler.run('DROP TABLE IF EXISTS employees CASCADE');
  await handler.run('DROP TABLE IF EXISTS departments CASCADE');
  await handler.run('DROP TABLE IF EXISTS coverage_member CASCADE');
  await handler.run('DROP TABLE IF EXISTS coverage_team CASCADE');
  await handler.run('DROP TABLE IF EXISTS coverage_composite CASCADE');

  await handler.run(`CREATE TABLE departments (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`);
  await handler.run(`
    CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      department_id INTEGER REFERENCES departments(id)
    )
  `);
  await handler.run(`
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES employees(id),
      order_date TIMESTAMP DEFAULT NOW(),
      total_amount DECIMAL(10, 2)
    )
  `);
  await handler.run(`CREATE TABLE coverage_team (id SERIAL PRIMARY KEY, name VARCHAR(255))`);
  await handler.run(`CREATE TABLE coverage_member (id SERIAL PRIMARY KEY, name VARCHAR(255), team_id INTEGER)`);
  await handler.run(`
    CREATE TABLE coverage_composite (
      part_a INTEGER,
      part_b INTEGER,
      label VARCHAR(255),
      PRIMARY KEY (part_a, part_b)
    )
  `);
}

function newEmployee(overrides: Partial<Employee> = {}): Employee {
  const emp = new Employee();
  emp.firstName = overrides.firstName ?? 'John';
  emp.lastName = overrides.lastName ?? 'Doe';
  emp.email = overrides.email ?? 'john@example.com';
  emp.createdAt = overrides.createdAt ?? new Date();
  if (overrides.departmentId != null) emp.departmentId = overrides.departmentId;
  return emp;
}

async function drain(stream: NodeJS.ReadableStream): Promise<unknown[]> {
  const rows: unknown[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on('data', row => rows.push(row));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  return rows;
}

describe.skipIf(!dbAvailable)('Execution paths (live PostgreSQL)', () => {
  let handler: PostgreSql;
  let db: CoverageContext;

  beforeAll(async () => {
    handler = new PostgreSql(TEST_DB_CONFIG);
    await handler.init();
  });

  afterAll(async () => {
    if (!handler) return;
    try {
      await handler.run('DROP TABLE IF EXISTS orders CASCADE');
      await handler.run('DROP TABLE IF EXISTS employees CASCADE');
      await handler.run('DROP TABLE IF EXISTS departments CASCADE');
      await handler.run('DROP TABLE IF EXISTS coverage_member CASCADE');
      await handler.run('DROP TABLE IF EXISTS coverage_team CASCADE');
      await handler.run('DROP TABLE IF EXISTS coverage_composite CASCADE');
    } catch {
      /* ignore */
    }
    try {
      await Promise.race([handler.connectionPool?.end(), new Promise(resolve => setTimeout(resolve, 5000))]);
    } catch {
      /* ignore */
    }
  }, 15000);

  beforeEach(async () => {
    await createSchema(handler);
    db = new CoverageContext(handler);
    await db.init();
  });

  describe('QuerySet', () => {
    beforeEach(async () => {
      await db.employees.insert(newEmployee({ firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' }));
      await db.employees.insert(newEmployee({ firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com' }));
    });

    it('listAndCount returns both the rows and the total', async () => {
      const { count, values } = await db.employees.where(e => e.eq('lastName', 'Smith')).listAndCount();
      expect(count).toBe(2);
      expect(values).toHaveLength(2);
    });

    it('streams rows as mapped entities', async () => {
      const stream = await db.employees.where(e => e.eq('lastName', 'Smith')).stream();
      const rows = await drain(stream);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toBeInstanceOf(Employee);
    });

    it('updates rows matched by the querySet where clause', async () => {
      const alice = await db.employees.where(e => e.eq('email', 'alice@example.com')).single();
      alice!.firstName = 'Alicia';
      await db.employees.where(e => e.eq('id', alice!.id)).update(alice!, 'firstName');

      const reread = await db.employees.get(alice!.id);
      expect(reread!.firstName).toBe('Alicia');
    });

    it('throws when a querySet update has no matching fields', async () => {
      const alice = await db.employees.where(e => e.eq('email', 'alice@example.com')).single();
      // Filtering to a key that is not a real column leaves the field list empty.
      await expect(db.employees.where(e => e.eq('id', alice!.id)).update(alice!, 'nope' as keyof Employee)).rejects.toThrow('Update Fields Empty');
    });

    it('updates every column when no explicit key list is given', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ firstName: 'A', email: 'allcols@example.com' }));
      saved.firstName = 'B';
      await db.employees.where(e => e.eq('id', saved.id)).update(saved);
      const reread = await db.employees.get(saved.id);
      expect(reread!.firstName).toBe('B');
    });

    it('deletes rows matched by the querySet where clause', async () => {
      const bob = await db.employees.where(e => e.eq('email', 'bob@example.com')).single();
      await db.employees.where(e => e.eq('id', bob!.id)).delete();
      expect(await db.employees.get(bob!.id)).toBeNull();
    });
  });

  describe('Expression guard clauses (empty/invalid results are ignored)', () => {
    it('drops an empty where expression', () => {
      const qs = db.employees.where(() => new sql.Expression());
      expect(qs.stat.where.exps).toHaveLength(0);
    });

    it('drops non-array and empty groupBy/orderBy results', () => {
      expect(db.employees.groupBy(() => undefined as never).stat.groupBy).toHaveLength(0);
      expect(db.employees.groupBy(() => [new sql.Expression()]).stat.groupBy).toHaveLength(0);
      expect(db.employees.orderBy(() => undefined as never).stat.orderBy).toHaveLength(0);
      expect(db.employees.orderBy(() => [new sql.Expression()]).stat.orderBy).toHaveLength(0);
    });

    // Regression: isValidExpression used to require exps.length > 0, which only compound
    // expressions (eq/and/asc/...) satisfy. GroupExprBuilder.expr() returns a bare leaf reference
    // (a `value` with no `exps`), so a plain `groupBy(e => [e.expr('col')])` - the obvious way to
    // call it - was silently dropped, making groupBy() a no-op for the common case. A genuinely
    // empty `new sql.Expression()` (no value, no exps) must still be dropped.
    it('keeps a bare column expression (e.g. from GroupExprBuilder.expr) as a valid clause', () => {
      const qs = db.employees.groupBy(e => [e.expr('lastName')]);
      expect(qs.stat.groupBy).toHaveLength(1);
      expect(qs.stat.groupBy[0].value).toBe('lastName');
    });

    it('drops empty where/group/order expressions on a joined set', () => {
      const joined = db.employees.join(db.departments, (e, d) => e.eq('departmentId', d.col('id')));
      joined.groupBy(() => [new sql.Expression()]);
      joined.orderBy(() => [new sql.Expression()]);
      expect(joined.stat.groupBy).toHaveLength(0);
      expect(joined.stat.orderBy).toHaveLength(0);

      const joined2 = db.employees
        .join(db.departments, (e, d) => e.eq('departmentId', d.col('id')))
        .where(() => new sql.Expression());
      expect(joined2.stat.where.exps).toHaveLength(0);
    });
  });

  describe('IQuerySet.singleOrThrow', () => {
    beforeEach(async () => {
      await db.employees.insert(newEmployee({ email: 'single@example.com' }));
    });

    it('returns the row when present', async () => {
      const row = await db.employees.where(e => e.eq('email', 'single@example.com')).singleOrThrow();
      expect(row.email).toBe('single@example.com');
    });

    it('throws when no row matches', async () => {
      await expect(db.employees.where(e => e.eq('email', 'missing@example.com')).singleOrThrow()).rejects.toThrow('Value Not Found');
    });
  });

  describe('TableSet', () => {
    it('listAndCount and stream delegate to a fresh QuerySet', async () => {
      await db.employees.insert(newEmployee({ email: 'ts1@example.com' }));
      await db.employees.insert(newEmployee({ email: 'ts2@example.com' }));

      const { count, values } = await db.employees.listAndCount();
      expect(count).toBe(2);
      expect(values).toHaveLength(2);

      const rows = await drain(await db.employees.stream());
      expect(rows).toHaveLength(2);
    });

    it('groupBy delegates to a fresh QuerySet and records the clause', async () => {
      // e.expr() as GroupExprBuilder's own docs intend it to be called - a bare column reference,
      // not wrapped in an extra operator. See "records a bare column expression" below for the
      // regression this covers (isValidExpression used to silently drop this).
      const qs = db.employees.groupBy(e => [e.expr('lastName')]);
      expect(qs.stat.groupBy.length).toBeGreaterThan(0);
    });

    it('updateBulk applies a single-row batch', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ firstName: 'Before', email: 'bulk@example.com' }));
      saved.firstName = 'After';
      await db.employees.updateBulk([saved], 'firstName');
      const reread = await db.employees.get(saved.id);
      expect(reread!.firstName).toBe('After');
    });

    it('update throws when only primary-key fields are supplied', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ email: 'noupd@example.com' }));
      await expect(db.employees.update(saved, 'id')).rejects.toThrow('Update Fields Empty');
    });

    it('insertAndFetch resolves a composite primary key', async () => {
      const item = new CompositeItem();
      item.partA = 1;
      item.partB = 2;
      item.label = 'combo';

      const saved = await db.composites.insertAndFetch(item);
      expect(saved.partA).toBe(1);
      expect(saved.partB).toBe(2);
      expect(saved.label).toBe('combo');
    });

    it('throws from get() when the entity has no primary key', async () => {
      await expect(db.nokeys.get('x' as never)).rejects.toThrow('No Primary Field Found');
    });

    it('throws from delete() when the entity has no primary key', async () => {
      const item = new NoKeyItem();
      item.name = 'x';
      await expect(db.nokeys.delete(item)).rejects.toThrow('Primary Key fields not found');
    });
  });

  describe('Eager-loaded collections (array foreign key)', () => {
    it('skips include keys that are not foreign relations', async () => {
      await db.employees.insert(newEmployee({ email: 'nf@example.com' }));
      // `firstName` has no @Foreign metadata, so the transformer leaves it be.
      const rows = await db.employees.include(['firstName' as keyof Employee]).list();
      expect(rows).toHaveLength(1);
      expect(rows[0].email).toBe('nf@example.com');
    });

    it('loads a one-to-many relation into an array property', async () => {
      const team = await db.teams.insertAndFetch(Object.assign(new Team(), { name: 'Blue' }));
      await db.members.insert(Object.assign(new Member(), { name: 'M1', teamId: team.id }));
      await db.members.insert(Object.assign(new Member(), { name: 'M2', teamId: team.id }));

      const loaded = await db.teams.include(['members']).where(t => t.eq('id', team.id)).single();
      expect(loaded).not.toBeNull();
      expect(Array.isArray(loaded!.members)).toBe(true);
      expect(loaded!.members).toHaveLength(2);
      expect(loaded!.members.map(m => m.name).sort()).toEqual(['M1', 'M2']);
    });
  });

  describe('JoinQuerySet', () => {
    beforeEach(async () => {
      const eng = await db.departments.insertAndFetch(Object.assign(new Department(), { name: 'Engineering' }));
      await db.employees.insert(newEmployee({ firstName: 'Alice', email: 'alice@example.com', departmentId: eng.id }));
      await db.employees.insert(newEmployee({ firstName: 'Bob', email: 'bob@example.com', departmentId: eng.id }));
    });

    it('listAndCount returns rows and total for a join', async () => {
      const { count, values } = await db.employees
        .join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id')))
        .listAndCount();
      expect(count).toBe(2);
      expect(values).toHaveLength(2);
    });

    it('streams joined rows', async () => {
      const stream = await db.employees.join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id'))).stream();
      const rows = await drain(stream);
      expect(rows).toHaveLength(2);
    });

    it('throws for an invalid expression on a chained join', () => {
      expect(() =>
        db.employees
          .join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id')))
          .join(db.orders, () => new sql.Expression())
      ).toThrow('Invalid Join');
    });

    it('builds groupBy and offset-limit clauses', () => {
      const joined = db.employees
        .join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id')))
        .groupBy(eb => [new sql.Expression(null, Operator.And, eb.expr('name'))])
        .limit(5, 2);

      expect(joined.stat.groupBy.length).toBeGreaterThan(0);
      // limit + offset -> two sub-expressions
      expect(joined.stat.limit.exps).toHaveLength(2);
    });

    it('drops non-array groupBy/orderBy results and re-uses a built column map', () => {
      const joined = db.employees.join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id')));

      joined.groupBy(() => undefined as never);
      joined.orderBy(() => undefined as never);
      expect(joined.stat.groupBy).toHaveLength(0);
      expect(joined.stat.orderBy).toHaveLength(0);

      // First call populates the column-field map; the second returns early.
      joined.initColumnFieldMap();
      const size = joined.columnFieldMap.size;
      joined.initColumnFieldMap();
      expect(joined.columnFieldMap.size).toBe(size);
    });
  });

  describe('Connection (transaction-scoped statement execution)', () => {
    it('routes runStatement and streamStatement through the transaction connection', async () => {
      const tx = await db.initTransaction();
      try {
        // runStatement via Connection
        await tx.employees.insert(newEmployee({ firstName: 'Tx', email: 'tx@example.com' }));
        expect(await tx.employees.where(e => e.eq('email', 'tx@example.com')).count()).toBe(1);

        // stream(string) via Connection
        const rawStream = await tx.stream("SELECT * FROM employees WHERE email = 'tx@example.com'");
        expect(await drain(rawStream)).toHaveLength(1);

        // streamStatement via Connection
        const stmtStream = await tx.employees.where(e => e.eq('email', 'tx@example.com')).stream();
        expect(await drain(stmtStream)).toHaveLength(1);
      } finally {
        await tx.rollback();
      }
    });
  });
});
