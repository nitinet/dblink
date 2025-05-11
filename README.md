# DBLink

A robust and type-safe ORM (Object-Relational Mapping) library for Node.js written in TypeScript. DBLink makes database interactions intuitive and maintainable with a decorator-based approach and strong typing throughout the entire query pipeline.

![Version](https://img.shields.io/badge/version-1.3.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-green)

## Overview

DBLink provides a powerful and intuitive way to interact with databases using TypeScript's type system. It leverages TypeScript decorators to define entity-database mappings with strong typing throughout the entire query pipeline.

## Features

- **TypeScript-First**: Fully leverages TypeScript's type system for type-safe database operations
- **Decorator-Based Mapping**: Simple and expressive entity-database mapping using decorators
- **Fluent Query API**: Intuitive interface for building complex database queries
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
    "emitDecoratorMetadata": true,
    // other options...
  }
}
```

### Required Dependencies

DBLink relies on several key dependencies:

- `reflect-metadata`: For decorator metadata
- `class-transformer`: For entity serialization/deserialization
- A database adapter (e.g., `dblink-mysql`, `dblink-postgres`)

### 1. Define your entities

```typescript
import { Table, Column, Id, Foreign } from 'dblink';

@Table('users')
class User {
  @Id()
  id!: number;
  
  @Column('first_name')
  firstName!: string;
  
  @Column('last_name')
  lastName!: string;
  
  @Column()
  email!: string;
  
  @Column('created_at')
  createdAt!: Date;
}

@Table('orders')
class Order {
  @Id()
  id!: number;
  
  @Column('user_id')
  userId!: number;

  @Foreign(User, (builder, parent) => builder.id.eq(parent.userId))
  user!: User;

  @Column('order_date')
  orderDate!: Date;
  
  @Column('total_amount')
  totalAmount!: number;
}
```

### 2. Create a database context

```typescript
import { Context } from 'dblink';
import { TableSet } from 'dblink';
import { User, Order } from './entities';
import MysqlDblink from 'dblink-mysql'; // or any other database driver

class DbContext extends Context {
  user = new TableSet(User);
  order = new TableSet(Order);
}

// Create a database context with connection options
const db = new DbContext(new MysqlDblink({
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'mydatabase'
}));

await db.init();

export default db;
```

### 3. Query your database

```typescript
// Find a single user
const user = await db.users
  .where(u => u.id.eq(1))
  .single();


// Find all users with filtering and ordering
const users = await db.users
  .where(u => u.lastName.eq('Smith'))
  .orderBy(u => u.firstName.asc())
  .list();

// Find user with slelected columns
const userWithSelectedColumns = await db.users
  .where(u => u.id.eq(1))
  .select('id', 'firstName', 'lastName')
  .single();

// Relationship queries
const ordersWithUsers = await db.orders
  .include('user')
  .where(o => o.totalAmount.eq(100))
  .list();

// Pagination
const page = await db.users
  .orderBy(u => u.createdAt.desc())
  .limit(10,10) // Skip 10, take 10
  .list();

// Aggregations
const totalOrders = await db.orders
  .where(o => o.userId.eq(1))
  .count();
```

### 4. Modify data

```typescript
// Insert a new user
const newUser = new User();
newUser.firstName = 'John';
newUser.lastName = 'Doe';
newUser.email = 'john@example.com';
newUser.createdAt = new Date();

await db.users.insert(newUser);

// Update a user
const userToUpdate = await db.users
  .where(u => u.id.eq(1))
  .single();

if (userToUpdate) {
  userToUpdate.email = 'new-email@example.com';
  await db.users.update(userToUpdate, 'email');
}

// Delete a user
const userToDelete = await db.users
  .where(u => u.id.eq(2))
  .single();

if(userToDelete) {
  await db.users.delete(userToDelete);
}
```

### 5. Transactions

```typescript
// Start a transaction
const transactionContext = await db.initTransaction();

try {
  // Perform multiple operations in a transaction
  const user = new User();
  user.firstName = 'Transaction';
  user.lastName = 'Test';
  user.email = 'transaction@example.com';
  user.createdAt = new Date();

  await transactionContext.users.insert(user);

  const order = new Order();
  order.userId = user.id;
  order.orderDate = new Date();
  order.totalAmount = 99.99;

  await transactionContext.orders.insert(order);

  // Commit the transaction
  await transactionContext.commit();
} catch (error) {
  console.error('Transaction failed:', error);
  await transactionContext.rollback();
}
```

## Advanced Features

### Custom Queries

```typescript
const query = 'SELECT * FROM users WHERE age > 18';

// Execute raw SQL queries
const results = await db.run(query);

// Stream large result sets
const stream = await db.stream(query);

stream.on('data', (user) => {
  console.log(user.firstName);
});
```

### Entity Relationships

DBLink supports various relationship types between entities:

#### One-to-Many Relationships

```typescript
@Table('departments')
class Department {
  @Id()
  id!: number;
  
  @Column()
  name!: string;
  
  // Virtual property for employees in this department
  @Foreign(Employee, (e, dept) => e.departmentId.eq(dept.id))
  employees!: Employee[];
}

@Table('employees')
class Employee {
  @Id()
  id!: number;
  
  @Column('department_id')
  departmentId!: number;
  
  @Foreign(Department, (d, emp) => d.id.eq(emp.departmentId))
  department!: Department;
}
```

### Query Building

DBLink provides a comprehensive set of query operators:

- Comparison: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- Logical: `and`, `or`, `not`
- String: `like`
- Collection: `in`
- Null checks: `isNull`, `isNotNull`
- Date: `between`
- Arithmetic: `add`, `subtract`, `multiply`, `divide`
- Aggregation: `count`, `sum`, `average`, `min`, `max`

## Decorator Reference

DBLink uses decorators to map TypeScript classes to database entities:

### @Table(tableName?: string)

Marks a class as a database table entity.

- `tableName`: Optional custom table name (defaults to class name if not provided)

### @Column(columnName?: string)

Maps a property to a database column.

- `columnName`: Optional custom column name (defaults to property name if not provided)

### @Id

Marks a property as the primary key for the entity.

### @Foreign(entityType, relationshipFunction)

Defines a relationship between entities.

- `entityType`: The related entity class
- `relationshipFunction`: A function defining how the entities are related

Example:
```typescript
@Foreign(User, (builder, parent) => builder.id.eq(parent.userId))
user!: User;
```

## API Reference

For detailed API documentation, please see the TypeScript definitions in the source code.

## Troubleshooting

### Common Issues

#### "Error: No metadata for type X"

- Make sure you've properly decorated your entity class with `@Table()`
- Ensure `reflect-metadata` is imported at the application entry point

#### "Error: Cannot find column Y on entity X"

- Check that the property is decorated with `@Column()` 
- Verify the column name matches the database schema

#### Performance Issues

- Use `include()` selectively to avoid N+1 query problems
- For large result sets, use streaming with `stream()` instead of `list()`
- Consider adding appropriate indexes to your database tables

## License

This project is licensed under the ISC License - see the LICENSE file for details.
