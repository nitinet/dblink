# Prisma Filter Parser

A parser that converts Prisma-style filter objects into DBLink Expression objects, enabling seamless integration between Prisma query syntax and the DBLink ORM.

## Overview

The Prisma Filter Parser allows you to use familiar Prisma filter syntax with DBLink's query builder system. It parses JavaScript/TypeScript objects following Prisma's `where` clause structure and converts them into SQL Expression objects compatible with DBLink.

## Features

- ✅ **Prisma-Compatible Syntax**: Use Prisma's intuitive filter object syntax
- ✅ **All Comparison Operators**: `equals`, `not`, `gt`, `gte`, `lt`, `lte`
- ✅ **String Operations**: `contains`, `startsWith`, `endsWith`
- ✅ **Collection Operations**: `in`, `notIn`
- ✅ **Logical Operators**: `AND`, `OR`, `NOT`
- ✅ **Null Handling**: Direct `null` values and explicit null checks
- ✅ **Shorthand Syntax**: Direct value assignment (e.g., `{ name: "John" }`)
- ✅ **Field Mapping**: Map entity field names to database column names
- ✅ **Complex Nesting**: Multiple levels of logical operators
- ✅ **Type-Safe**: Full TypeScript support

## Installation

The Prisma Filter Parser is included in the DBLink OData parser module:

```typescript
import { PrismaFilterParser, parsePrismaFilter } from 'dblink/odata-parser';
```

## Basic Usage

### Simple Filters

```typescript
import { parsePrismaFilter } from 'dblink/odata-parser';

// Shorthand equality
const filter1 = parsePrismaFilter({ name: 'John' });

// Explicit equals operator
const filter2 = parsePrismaFilter({ name: { equals: 'John' } });

// Multiple conditions (implicit AND)
const filter3 = parsePrismaFilter({
  name: 'John',
  age: 25,
  active: true
});
```

### Comparison Operators

```typescript
// Greater than
const filter = parsePrismaFilter({ age: { gt: 25 } });

// Greater than or equal
const filter = parsePrismaFilter({ age: { gte: 18 } });

// Less than
const filter = parsePrismaFilter({ score: { lt: 100 } });

// Less than or equal
const filter = parsePrismaFilter({ price: { lte: 50.00 } });

// Not equal
const filter = parsePrismaFilter({ status: { not: 'deleted' } });

// Range (multiple conditions on same field)
const filter = parsePrismaFilter({ 
  age: { gte: 18, lte: 65 } 
});
```

### String Operations

```typescript
// Contains
const filter = parsePrismaFilter({ 
  email: { contains: '@example.com' } 
});

// Starts with
const filter = parsePrismaFilter({ 
  name: { startsWith: 'John' } 
});

// Ends with
const filter = parsePrismaFilter({ 
  email: { endsWith: '.com' } 
});
```

### Collection Operations

```typescript
// IN operator
const filter = parsePrismaFilter({ 
  status: { in: ['active', 'pending', 'approved'] } 
});

// NOT IN operator
const filter = parsePrismaFilter({ 
  role: { notIn: ['admin', 'superadmin'] } 
});
```

### Logical Operators

```typescript
// AND (explicit)
const filter = parsePrismaFilter({
  AND: [
    { name: 'John' },
    { age: { gt: 25 } },
    { active: true }
  ]
});

// OR
const filter = parsePrismaFilter({
  OR: [
    { name: 'John' },
    { name: 'Jane' }
  ]
});

// NOT
const filter = parsePrismaFilter({
  NOT: { status: 'banned' }
});

// Complex nesting
const filter = parsePrismaFilter({
  AND: [
    {
      OR: [
        { name: { contains: 'Smith' } },
        { email: { endsWith: '@example.com' } }
      ]
    },
    { age: { gte: 18, lte: 65 } },
    { NOT: { status: 'suspended' } }
  ]
});
```

### Null Handling

```typescript
// IS NULL
const filter = parsePrismaFilter({ email: null });

// IS NOT NULL
const filter = parsePrismaFilter({ email: { not: null } });

// Combined null checks
const filter = parsePrismaFilter({
  AND: [
    { email: { not: null } },
    { deletedAt: null }
  ]
});
```

## Integration with DBLink

### Basic Integration

```typescript
import { Context } from 'dblink';
import { parsePrismaFilter } from 'dblink/odata-parser';

// Define your context and entities
const db = new MyDbContext(handler);

// Use Prisma-style filter
const prismaWhere = {
  AND: [
    { age: { gt: 25 } },
    { name: { contains: 'John' } },
    { active: true }
  ]
};

// Parse and use with DBLink
const expression = parsePrismaFilter(prismaWhere);
const users = await db.users
  .where(() => expression)
  .list();
```

### Field Mapping

Map entity property names to database column names:

```typescript
import { PrismaFilterParser } from 'dblink/odata-parser';

// Create parser with field mapping
const fieldMap = new Map([
  ['firstName', 'first_name'],
  ['lastName', 'last_name'],
  ['emailAddress', 'email_addr'],
  ['isActive', 'active_flag']
]);

const parser = new PrismaFilterParser(fieldMap);

// Use entity field names in filter
const filter = parser.parse({
  firstName: 'John',
  emailAddress: { contains: '@example.com' },
  isActive: true
});

// Parser will use database column names:
// first_name = 'John' AND email_addr LIKE '%@example.com%' AND active_flag = true
```

### Using with Query Builder

```typescript
// Complex query with Prisma filters
const users = await db.users
  .where(() => parsePrismaFilter({
    OR: [
      { name: { contains: 'Smith' } },
      { email: { endsWith: '@company.com' } }
    ],
    age: { gte: 18 },
    status: { in: ['active', 'pending'] }
  }))
  .orderBy(u => [u.asc('name')])
  .limit(10, 0)
  .list();
```

## API Reference

### PrismaFilterParser Class

```typescript
class PrismaFilterParser {
  constructor(fieldColumnMap?: Map<string, string>);
  parse(filter: PrismaWhereInput | null | undefined): Expression;
}
```

**Parameters:**

- `fieldColumnMap`: Optional map of entity field names to database column names

**Methods:**

- `parse(filter)`: Converts a Prisma filter object into a DBLink Expression

### Helper Functions

```typescript
// Create a parser instance
function createPrismaFilterParser(
  fieldColumnMap?: Map<string, string>
): PrismaFilterParser;

// Parse a filter directly
function parsePrismaFilter(
  filter: PrismaWhereInput | null | undefined,
  fieldColumnMap?: Map<string, string>
): Expression;
```

## Supported Operators

### Comparison Operations

| Prisma Operator | SQL Operator | Example |
|----------------|--------------|---------|
| `equals` | `=` | `{ age: { equals: 25 } }` |
| `not` | `!=` or `IS NOT NULL` | `{ status: { not: 'banned' } }` |
| `gt` | `>` | `{ age: { gt: 25 } }` |
| `gte` | `>=` | `{ age: { gte: 18 } }` |
| `lt` | `<` | `{ price: { lt: 100 } }` |
| `lte` | `<=` | `{ score: { lte: 100 } }` |

### String Operators

| Prisma Operator | SQL Operator | Example |
|----------------|--------------|---------|
| `contains` | `LIKE '%value%'` | `{ name: { contains: 'John' } }` |
| `startsWith` | `LIKE 'value%'` | `{ email: { startsWith: 'admin' } }` |
| `endsWith` | `LIKE '%value'` | `{ email: { endsWith: '.com' } }` |

### Collection Operators

| Prisma Operator | SQL Operator | Example |
|----------------|--------------|---------|
| `in` | `IN (...)` | `{ id: { in: [1, 2, 3] } }` |
| `notIn` | `NOT IN (...)` | `{ role: { notIn: ['admin'] } }` |

### Logical Operations

| Prisma Operator | SQL Operator | Example |
|----------------|--------------|---------|
| `AND` | `AND` | `{ AND: [{ ... }, { ... }] }` |
| `OR` | `OR` | `{ OR: [{ ... }, { ... }] }` |
| `NOT` | `NOT` | `{ NOT: { ... } }` |

### Null Operators

| Prisma Syntax | SQL Operator | Example |
|--------------|--------------|---------|
| `field: null` | `IS NULL` | `{ email: null }` |
| `field: { not: null }` | `IS NOT NULL` | `{ email: { not: null } }` |

## Comparison with OData Parser

Both parsers produce the same DBLink Expression structure:

```typescript
// Prisma style
const prismaFilter = {
  name: { contains: 'John' },
  age: { gt: 25 }
};
const expr1 = parsePrismaFilter(prismaFilter);

// OData style
const odataFilter = "contains(name, 'John') and age gt 25";
const expr2 = parseFilter(odataFilter);

// Both expr1 and expr2 produce equivalent SQL expressions
```

## Error Handling

The parser throws `PrismaFilterParseError` for invalid filters:

```typescript
try {
  // Invalid: 'in' requires an array
  const filter = parsePrismaFilter({ 
    status: { in: 'not-an-array' } 
  });
} catch (error) {
  if (error instanceof PrismaFilterParseError) {
    console.error('Invalid filter:', error.message);
  }
}
```

## Limitations

- **Relation filters**: Not currently supported (e.g., `posts: { some: { ... } }`)
- **Scalar list filters**: Not supported (e.g., `tags: { has: 'typescript' }`)
- **Case sensitivity**: Controlled by database settings, not the `mode` option
- **Advanced filters**: JSON filters, full-text search not supported

## Examples

See the `examples/prisma-filter-usage.ts` file for comprehensive examples.

## Testing

Run the tests:

```bash
npm test -- prisma-filter-parser.test.ts
```

## License

Same as DBLink package license.
