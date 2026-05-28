# DBLink

A robust and type-safe ORM (Object-Relational Mapping) library for Node.js written in TypeScript. DBLink makes database interactions intuitive and maintainable with a decorator-based approach and strong typing throughout the entire query pipeline.

![Version](https://img.shields.io/badge/version-1.4.4-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-green)

## Overview

DBLink provides a powerful and intuitive way to interact with databases using TypeScript's type system. It leverages TypeScript decorators to define entity-database mappings with strong typing throughout the entire query pipeline.

## Features

- **TypeScript-First**: Fully leverages TypeScript's type system for type-safe database operations
- **Decorator-Based Mapping**: Simple and expressive entity-database mapping using decorators
- **Fluent Query API**: Intuitive interface for building complex database queries
- **Join Support**: Perform INNER JOIN, LEFT JOIN, and RIGHT JOIN across multiple entities with full type safety
- **Relationship Support**: Define and navigate one-to-many and many-to-many relationships
- **Transaction Support**: Execute multiple operations in atomic transactions
- **Streaming Support**: Stream query results for memory-efficient data processing
- **Extensible**: Built on modular architecture that can be extended for various database systems

## Installation

```bash
npm install dblink
# or
yarn add dblink
# or
pnpm add dblink
```

### Database Adapters

DBLink requires a database adapter to connect to your specific database. Install the appropriate adapter for your database system:

- **[MySQL/MariaDB](https://www.mysql.com/)**: `npm install dblink-mysql`
- **[PostgreSQL](https://www.postgresql.org/)**: `npm install dblink-pg`
- **[SQLite](https://www.sqlite.org/)**: `npm install dblink-sqlite`
- **[Microsoft SQL Server](https://www.microsoft.com/sql-server)**: `npm install dblink-mssql`
- **[Oracle Database](https://www.oracle.com/database/)**: `npm install dblink-oracle`

Each adapter provides optimized connectivity and query translation for its specific database system. For complete installation and configuration details, see the adapter-specific documentation.

## Getting Started with DBLink

DBLink is designed to be easy to set up and integrate with your TypeScript/Node.js projects. Follow these steps to get started:

### Prerequisites

- Node.js 18.0 or higher
- TypeScript 5.0 or higher
- Enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Required Dependencies

DBLink relies on several key dependencies:

- `reflect-metadata`: For decorator metadata
- `class-transformer`: For entity serialization/deserialization
- A database adapter (e.g., `dblink-pg`, `dblink-mysql`)

### 1. Define your entities

```typescript
import { Table, Column, Id, Foreign } from 'dblink';

@Table('departments')
class Department {
  @Id
  @Column()
  id!: number;

  @Column()
  name!: string;
}

@Table('employees')
class Employee {
  @Id
  @Column()
  id!: number;

  @Column('first_name')
  firstName!: string;

  @Column('last_name')
  lastName!: string;

  @Column()
  email!: string;

  @Column('created_at')
  createdAt!: Date;

  @Column('department_id')
  departmentId!: number;

  @Foreign(Department, (builder, parent) => builder.eq('id', (parent as Employee).departmentId))
  department!: Department;
}

@Table('orders')
class Order {
  @Id
  @Column()
  id!: number;

  @Column('user_id')
  userId!: number;

  @Foreign(Employee, (builder, parent) => builder.eq('id', (parent as Order).userId))
  employee!: Employee;

  @Column('order_date')
  orderDate!: Date;

  @Column('total_amount')
  totalAmount!: number;
}
```

### 2. Create a database context

```typescript
import { Context, TableSet } from 'dblink';
import PostgreSql from 'dblink-pg'; // or any other database adapter

class DbContext extends Context {
  employees = new TableSet(Employee);
  departments = new TableSet(Department);
  orders = new TableSet(Order);
}

const db = new DbContext(new PostgreSql({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'mydatabase'
}));

await db.init();

export default db;
```

### 3. Query your database

```typescript
// Find a single employee by primary key
const employee = await db.employees
  .where(u => u.eq('id', 1))
  .single();

// Find all employees with filtering and ordering
const employees = await db.employees
  .where(u => u.eq('lastName', 'Smith'))
  .orderBy(u => [u.asc('firstName')])
  .list();

// Select specific columns
const names = await db.employees
  .where(u => u.eq('id', 1))
  .select(['id', 'firstName', 'lastName'])
  .single();

// Load related entities (eager loading)
const ordersWithEmployees = await db.orders
  .include(['employee'])
  .where(o => o.eq('totalAmount', 100))
  .list();

// Pagination — skip 10, take 10
const page = await db.employees
  .orderBy(u => [u.desc('createdAt')])
  .limit(10, 10)
  .list();

// Count
const totalOrders = await db.orders
  .where(o => o.eq('userId', 1))
  .count();
```

### 4. Modify data

```typescript
// Insert
const newEmployee = new Employee();
newEmployee.firstName = 'John';
newEmployee.lastName = 'Doe';
newEmployee.email = 'john@example.com';
newEmployee.createdAt = new Date();

await db.employees.insert(newEmployee);

// Insert and return the saved entity
const savedEmployee = await db.employees.insertAndFetch(newEmployee);

// Bulk insert
await db.employees.insertBulk([employee1, employee2]);

// Update specific columns
const employeeToUpdate = await db.employees.where(u => u.eq('id', 1)).single();
if (employeeToUpdate) {
  employeeToUpdate.email = 'new-email@example.com';
  await db.employees.update(employeeToUpdate, 'email');
}

// Delete
const employeeToDelete = await db.employees.where(u => u.eq('id', 2)).single();
if (employeeToDelete) {
  await db.employees.delete(employeeToDelete);
}
```

### 5. Transactions

```typescript
const transactionContext = await db.initTransaction();

try {
  const employee = new Employee();
  employee.firstName = 'Transaction';
  employee.lastName = 'Test';
  employee.email = 'tx@example.com';
  employee.createdAt = new Date();

  await transactionContext.employees.insert(employee);

  const order = new Order();
  order.userId = employee.id;
  order.orderDate = new Date();
  order.totalAmount = 99.99;

  await transactionContext.orders.insert(order);

  await transactionContext.commit();
} catch (error) {
  console.error('Transaction failed:', error);
  await transactionContext.rollback();
}
```

## Advanced Features

### Join Queries

DBLink supports type-safe JOIN operations across multiple entities. The `join()` method produces a `JoinQuerySet<T, U>` — a fully typed result that merges the fields of both tables.

#### Signature

```typescript
tableSet.join(
  rightSet: IQuerySet<U>,
  onCondition: (left: WhereExprBuilder<T>, right: BaseExprBuilder<U>) => Expression,
  joinType?: sql.types.Join  // default: InnerJoin
): JoinQuerySet<T, U>
```

- **`rightSet`** — the `TableSet` or `QuerySet` to join to.
- **`onCondition`** — a callback that receives expression builders for both sides and returns the ON expression. Use `left.eq(...)` for the left table and `right.col(...)` to reference a column on the right table.
- **`joinType`** — optional; one of `sql.types.Join.InnerJoin` (default), `LeftJoin`, or `RightJoin`.

#### Inner Join (default)

```typescript
import { sql } from 'dblink-core';

const results = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id'))
  )
  .list();

// results is typed as (Employee & Department)[]
// each row has both employee and department fields
```

#### Left Join

```typescript
const results = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id')),
    sql.types.Join.LeftJoin
  )
  .list();
```

#### Right Join

```typescript
const results = await db.departments
  .join(
    db.employees,
    (dept, emp) => dept.eq('id', emp.col('departmentId')),
    sql.types.Join.RightJoin
  )
  .list();
```

#### Filtering, Ordering, and Pagination on Joins

All standard query methods are available on a `JoinQuerySet`:

```typescript
const results = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id'))
  )
  .where(eb => eb.eq('firstName', 'John'))
  .orderBy(eb => [eb.asc('lastName')])
  .limit(10)
  .list();
```

#### Selecting Specific Columns from a Join

```typescript
const results = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id'))
  )
  .select(['firstName', 'lastName', 'name'])  // 'name' is from Department
  .list();
```

#### Counting Join Results

```typescript
const count = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id'))
  )
  .where(eb => eb.eq('name', 'Engineering'))
  .count();
```

#### Chained (Multi-Table) Joins

Because `JoinQuerySet` itself extends `IQuerySet`, you can chain further joins:

```typescript
const results = await db.employees
  .join(
    db.departments,
    (emp, dept) => emp.eq('departmentId', dept.col('id'))
  )
  .join(
    db.orders,
    (empDept, ord) => empDept.eq('id', ord.col('userId'))
  )
  .where(eb => eb.eq('name', 'Engineering'))
  .list();
```

#### Column Naming in Join Results

When two tables share a column name (e.g., both have `id`), DBLink prefixes each column with the table alias in the returned rows to avoid conflicts:

| SQL column | Result key |
|---|---|
| `e.id` | `e_id` |
| `d.id` | `d_id` |
| `e.first_name` | `e_first_name` |
| `d.name` | `d_name` |

The table alias is the first letter of the table name (e.g., `employees` → `e`, `departments` → `d`).

### Custom Queries

```typescript
// Execute raw SQL
const results = await db.run('SELECT * FROM employees WHERE department_id = 1');

// Stream large result sets
const stream = await db.stream('SELECT * FROM employees ORDER BY id');

stream.on('data', (row) => {
  console.log(row.first_name);
});

stream.on('end', () => {
  console.log('Done');
});
```

### Entity Relationships

DBLink supports relationship loading via `include()`:

```typescript
// Load orders together with their related employee
const orders = await db.orders
  .include(['employee'])
  .list();

orders.forEach(order => {
  console.log(order.employee.firstName);
});
```

### Query Building

DBLink provides a comprehensive set of query operators through the expression builder:

#### Comparison
| Method | SQL |
|---|---|
| `eq('field', value)` | `field = value` |
| `neq('field', value)` | `field != value` |
| `gt('field', value)` | `field > value` |
| `gteq('field', value)` | `field >= value` |
| `lt('field', value)` | `field < value` |
| `lteq('field', value)` | `field <= value` |

#### String / Pattern
| Method | SQL |
|---|---|
| `like('field', pattern)` | `field LIKE pattern` |

#### Null Checks
| Method | SQL |
|---|---|
| `isNull('field')` | `field IS NULL` |
| `isNotNull('field')` | `field IS NOT NULL` |

#### Collection
| Method | SQL |
|---|---|
| `in('field', ...values)` | `field IN (...)` |
| `between('field', low, high)` | `field BETWEEN low AND high` |

#### Arithmetic
| Method | SQL |
|---|---|
| `plus('field', value)` | `field + value` |
| `minus('field', value)` | `field - value` |

## Decorator Reference

### `@Table(tableName: string)`

Marks a class as a database table entity.

```typescript
@Table('employees')
class Employee { ... }
```

### `@Column(columnName?: string)`

Maps a property to a database column. If `columnName` is omitted, the property name is used.

```typescript
@Column('first_name')
firstName!: string;

@Column()
email!: string;
```

### `@Id`

Marks a property as the primary key.

```typescript
@Id
@Column()
id!: number;
```

### `@Foreign(entityType, relationshipFn)`

Defines a relationship between entities.

- `entityType` — the related entity class
- `relationshipFn` — `(builder, parent) => Expression` defining the join condition

```typescript
@Foreign(Department, (builder, parent) => builder.eq('id', (parent as Employee).departmentId))
department!: Department;
```

## API Reference

### `TableSet<T>`

The primary interface for interacting with a database table.

| Method | Description |
|---|---|
| `insert(entity)` | Insert a new row |
| `insertAndFetch(entity)` | Insert and return the saved entity |
| `insertBulk(entities)` | Insert multiple rows |
| `update(entity, ...keys)` | Update specific columns |
| `updateBulk(entities, ...keys)` | Update multiple rows |
| `upsert(entity)` | Insert or update |
| `delete(entity)` | Delete a row |
| `deleteBulk(entities)` | Delete multiple rows |
| `get(...ids)` | Find by primary key |
| `where(fn)` | Filter rows |
| `orderBy(fn)` | Sort rows |
| `groupBy(fn)` | Group rows |
| `limit(size, index?)` | Paginate |
| `select(keys)` | Pick specific columns |
| `include(keys)` | Eager-load related entities |
| `join(set, onFn, joinType?)` | Join with another table |
| `list()` | Execute and return all rows |
| `count()` | Execute and return total count |
| `single()` | Execute and return first row or `null` |
| `stream()` | Stream results as a `Readable` |

### `JoinQuerySet<T, U>`

Returned by `join()`. Supports the same fluent methods as `TableSet` plus an additional `join()` for further chaining.

| Method | Description |
|---|---|
| `where(fn)` | Filter using fields from T or U |
| `orderBy(fn)` | Sort using fields from T or U |
| `groupBy(fn)` | Group using fields from T or U |
| `limit(size, index?)` | Paginate |
| `select(keys)` | Pick specific columns from T or U |
| `join(set, onFn, joinType?)` | Chain another join |
| `list()` | Execute and return `(T & U)[]` |
| `count()` | Execute and return total count |
| `listAndCount()` | Execute and return `{ values, count }` |
| `stream()` | Stream results as a `Readable` |

## Troubleshooting

### "Table Name Not Found"

- Make sure your entity class is decorated with `@Table('table_name')`.
- Ensure `reflect-metadata` is imported at the application entry point before any entity imports.

### "Field Not Found" on join condition

- The right-hand side of a join condition must use `dept.col('fieldName')` (the public `col()` method) — not a direct property access.

### "Invalid Join" error

- The ON expression passed to `join()` must produce a valid non-empty `Expression`. Verify that the field names used in the callback exist on their respective entity types.

### Performance Tips

- Use `select([...keys])` to fetch only the columns you need.
- Use `include()` selectively — loading every relationship eagerly can cause N+1 query problems.
- For large result sets, prefer `stream()` over `list()` to avoid loading everything into memory.
- Use `limit()` with `count()` for efficient pagination.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
