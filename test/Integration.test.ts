import PostgreSql from 'dblink-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Department from './model/Department.js';
import Employee from './model/Employee.js';
import Order from './model/Order.js';
import TestDbContext from './TestDbContext.js';

/**
 * End-to-end ORM integration tests.
 *
 * Unlike the pure unit suites, these exercise the full pipeline
 * (decorator metadata -> Statement AST -> Handler -> ResultSet -> entity mapping)
 * against a live PostgreSQL instance using the actual entity models. The schema
 * created here matches the `employees` / `departments` / `orders` tables the
 * models map to, so CRUD, query building, eager-loading and joins are validated
 * against real SQL rather than just asserting that builders return an object.
 */

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

// Probe the database once at load time so the whole suite can be skipped
// cleanly when PostgreSQL is not reachable (e.g. CI without a database).
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

  await handler.run(`
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `);

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

// Insert fixtures one-by-one. `insertBulk` cannot be used for seeding because
// dblink-core concatenates the per-row parameterized statements with ';' and
// dblink-pg's extended (prepared) protocol rejects multi-command queries — see
// the "Bulk operations" block below, which pins that limitation explicitly.
async function seedEmployees(db: TestDbContext, employees: Employee[]): Promise<void> {
  for (const emp of employees) await db.employees.insert(emp);
}

describe.skipIf(!dbAvailable)('DBLink ORM Integration (live PostgreSQL)', () => {
  let handler: PostgreSql;
  let db: TestDbContext;

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
    db = new TestDbContext(handler);
    await db.init();
  });

  describe('Insert & Get', () => {
    it('inserts a row and reads it back mapped to the entity', async () => {
      await db.employees.insert(newEmployee({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }));

      const all = await db.employees.list();
      expect(all).toHaveLength(1);
      expect(all[0]).toBeInstanceOf(Employee);
      expect(all[0].firstName).toBe('Ada');
      expect(all[0].lastName).toBe('Lovelace');
      expect(all[0].email).toBe('ada@example.com');
      expect(all[0].id).toBeGreaterThan(0);
    });

    it('insertAndFetch returns the persisted entity with a generated id', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ firstName: 'Grace', email: 'grace@example.com' }));

      expect(saved).toBeInstanceOf(Employee);
      expect(saved.id).toBeGreaterThan(0);
      expect(saved.firstName).toBe('Grace');

      const fetched = await db.employees.get(saved.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.email).toBe('grace@example.com');
    });

    it('get returns null when no row matches', async () => {
      const missing = await db.employees.get(999999);
      expect(missing).toBeNull();
    });

    it('get throws when the wrong number of key params is supplied', async () => {
      await expect(db.employees.get()).rejects.toThrow('Invalid Arguments Length');
    });
  });

  describe('list & count', () => {
    it('reflects every persisted row', async () => {
      await seedEmployees(db, [
        newEmployee({ firstName: 'A', email: 'a@example.com' }),
        newEmployee({ firstName: 'B', email: 'b@example.com' }),
        newEmployee({ firstName: 'C', email: 'c@example.com' })
      ]);

      expect(await db.employees.count()).toBe(3);
      const list = await db.employees.list();
      expect(list.map(e => e.firstName).sort()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('Query building against real data', () => {
    beforeEach(async () => {
      await seedEmployees(db, [
        newEmployee({ firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' }),
        newEmployee({ firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com' }),
        newEmployee({ firstName: 'Carol', lastName: 'Jones', email: 'carol@example.com' })
      ]);
    });

    it('where filters rows', async () => {
      const smiths = await db.employees.where(e => e.eq('lastName', 'Smith')).list();
      expect(smiths).toHaveLength(2);
      expect(smiths.every(e => e.lastName === 'Smith')).toBe(true);
    });

    it('where + single returns exactly one row', async () => {
      const bob = await db.employees.where(e => e.eq('email', 'bob@example.com')).single();
      expect(bob).not.toBeNull();
      expect(bob!.firstName).toBe('Bob');
    });

    it('single throws when more than one row matches', async () => {
      await expect(db.employees.where(e => e.eq('lastName', 'Smith')).single()).rejects.toThrow('More than one row found');
    });

    it('orderBy sorts ascending and descending', async () => {
      const asc = await db.employees.orderBy(e => [e.asc('firstName')]).list();
      expect(asc.map(e => e.firstName)).toEqual(['Alice', 'Bob', 'Carol']);

      const desc = await db.employees.orderBy(e => [e.desc('firstName')]).list();
      expect(desc.map(e => e.firstName)).toEqual(['Carol', 'Bob', 'Alice']);
    });

    it('limit caps the number of returned rows', async () => {
      const limited = await db.employees.orderBy(e => [e.asc('firstName')]).limit(2).list();
      expect(limited).toHaveLength(2);
      expect(limited.map(e => e.firstName)).toEqual(['Alice', 'Bob']);
    });

    it('select projects only the requested columns', async () => {
      const rows = await db.employees.where(e => e.eq('firstName', 'Alice')).select(['id', 'firstName']).list();
      expect(rows).toHaveLength(1);
      expect(rows[0].firstName).toBe('Alice');
      // Non-selected columns are excluded from the projection.
      expect((rows[0] as Partial<Employee>).email).toBeUndefined();
    });

    it('count reflects the where clause', async () => {
      expect(await db.employees.where(e => e.eq('lastName', 'Smith')).count()).toBe(2);
      expect(await db.employees.where(e => e.eq('lastName', 'Nobody')).count()).toBe(0);
    });

    it('in operator matches any of the supplied values', async () => {
      const rows = await db.employees.where(e => e.in('firstName', 'Alice', 'Carol')).list();
      expect(rows.map(e => e.firstName).sort()).toEqual(['Alice', 'Carol']);
    });
  });

  describe('Update, upsert & delete', () => {
    it('update persists changed fields and returns the fresh entity', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ firstName: 'Old', email: 'update@example.com' }));

      saved.firstName = 'New';
      const updated = await db.employees.update(saved, 'firstName');
      expect(updated.firstName).toBe('New');

      const reread = await db.employees.get(saved.id);
      expect(reread!.firstName).toBe('New');
    });

    it('upsert inserts when the row is new and updates when it exists', async () => {
      // Insert path (no id yet).
      const inserted = await db.employees.upsert(newEmployee({ firstName: 'Fresh', email: 'upsert@example.com' }));
      expect(inserted.id).toBeGreaterThan(0);
      expect(await db.employees.count()).toBe(1);

      // Update path (existing id).
      inserted.lastName = 'Changed';
      const updated = await db.employees.upsert(inserted);
      expect(updated.lastName).toBe('Changed');
      expect(await db.employees.count()).toBe(1);
    });

    it('delete removes a single row', async () => {
      const saved = await db.employees.insertAndFetch(newEmployee({ email: 'delete@example.com' }));
      await db.employees.delete(saved);
      expect(await db.employees.get(saved.id)).toBeNull();
    });
  });

  // The *Bulk helpers build one parameterized statement per row and hand the
  // array to the handler, which dblink-core concatenates with ';'. PostgreSQL's
  // extended/prepared protocol (used whenever bind parameters are present)
  // forbids multiple commands in one query, so these currently fail for >1 row.
  // These tests pin that limitation: if a future dblink-core/dblink-pg release
  // executes array statements individually, they will start passing and should
  // be rewritten to assert success.
  describe('Bulk operations (known dblink-pg multi-command limitation)', () => {
    it('insertBulk rejects for more than one row', async () => {
      await expect(db.employees.insertBulk([newEmployee({ email: 'b1@example.com' }), newEmployee({ email: 'b2@example.com' })])).rejects.toThrow(/multiple commands/i);
    });

    it('deleteBulk rejects for more than one row', async () => {
      const a = await db.employees.insertAndFetch(newEmployee({ email: 'del1@example.com' }));
      const b = await db.employees.insertAndFetch(newEmployee({ email: 'del2@example.com' }));
      await expect(db.employees.deleteBulk([a, b])).rejects.toThrow(/multiple commands/i);
    });
  });

  describe('Constraint violations surface as errors', () => {
    it('rejects a duplicate unique email', async () => {
      await db.employees.insert(newEmployee({ email: 'dupe@example.com' }));
      await expect(db.employees.insert(newEmployee({ email: 'dupe@example.com' }))).rejects.toThrow();
    });
  });

  describe('Eager loading with include()', () => {
    it('loads a related entity through a foreign key', async () => {
      const dept = await db.departments.insertAndFetch(Object.assign(new Department(), { name: 'Engineering' }));
      const emp = await db.employees.insertAndFetch(newEmployee({ firstName: 'Eng', email: 'eng@example.com', departmentId: dept.id }));
      await db.orders.insert(Object.assign(new Order(), { userId: emp.id, totalAmount: 100, orderDate: new Date() }));

      const orders = await db.orders.include(['employee']).list();
      expect(orders).toHaveLength(1);
      expect(orders[0].employee).toBeInstanceOf(Employee);
      expect(orders[0].employee.firstName).toBe('Eng');
    });

    it('resolves a chain of relations (order -> employee -> department)', async () => {
      const dept = await db.departments.insertAndFetch(Object.assign(new Department(), { name: 'Sales' }));
      const emp = await db.employees.insertAndFetch(newEmployee({ firstName: 'Sam', email: 'sam@example.com', departmentId: dept.id }));

      const loaded = await db.employees.include(['department']).where(e => e.eq('id', emp.id)).single();
      expect(loaded).not.toBeNull();
      expect(loaded!.department).toBeInstanceOf(Department);
      expect(loaded!.department.name).toBe('Sales');
    });
  });

  describe('Join execution', () => {
    beforeEach(async () => {
      const eng = await db.departments.insertAndFetch(Object.assign(new Department(), { name: 'Engineering' }));
      const sales = await db.departments.insertAndFetch(Object.assign(new Department(), { name: 'Sales' }));
      await seedEmployees(db, [
        newEmployee({ firstName: 'Alice', email: 'alice@example.com', departmentId: eng.id }),
        newEmployee({ firstName: 'Bob', email: 'bob@example.com', departmentId: sales.id })
      ]);
    });

    it('returns merged rows across both tables', async () => {
      const rows = await db.employees.join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id'))).list();
      expect(rows).toHaveLength(2);
      const byName = Object.fromEntries(rows.map(r => [(r as Employee & Department).firstName, (r as Employee & Department).name]));
      expect(byName['Alice']).toBe('Engineering');
      expect(byName['Bob']).toBe('Sales');
    });

    it('supports where + count on the joined set', async () => {
      const joined = db.employees.join(db.departments, (emp, dept) => emp.eq('departmentId', dept.col('id'))).where(eb => eb.eq('firstName', 'Alice'));

      expect(await joined.count()).toBe(1);
      const rows = await joined.list();
      expect(rows).toHaveLength(1);
      expect((rows[0] as Employee & Department).name).toBe('Engineering');
    });
  });

  describe('Context wiring', () => {
    it('registers every TableSet in tableSetMap', () => {
      expect(db.tableSetMap.get(Employee)).toBe(db.employees);
      expect(db.tableSetMap.get(Order)).toBe(db.orders);
      expect(db.tableSetMap.get(Department)).toBe(db.departments);
    });
  });
});
