# Purpose

Create reusable repository abstractions over DBLink table/query APIs.

# When to use

- Data access is duplicated across multiple services.
- You need centralized query conventions.

# Prerequisites

- Entity metadata is complete (`@Table`, `@Column`, `@Id`).
- DBLink context already initialized.

# Inputs

- Entity type
- Required retrieval/write methods

# Outputs

- Repository functions with typed DBLink queries

# Files normally modified

Not found in current codebase for explicit repository classes.

Closest editable modules in this repo:
- `src/collection/TableSet.ts`
- `src/collection/QuerySet.ts`

# Implementation Steps

1. Define repository method signatures.
2. Implement methods with `where`, `select`, `orderBy`, `limit`, `join`, `include`.
3. Use `getOrThrow` when null is invalid.
4. Add transaction-aware methods for multi-step writes.
5. Write integration tests with realistic data setup.

# Validation

- Methods return expected typed results.
- SQL behavior matches test assertions.

# Common mistakes

- Returning unbounded result sets.
- Forgetting to exclude PK fields from updates.

# Related skills

- `create-test`
- `optimize-performance`
- `refactor-module`

# Example from repository

- `TableSet.get`, `TableSet.update`, `TableSet.upsert` in `src/collection/TableSet.ts`
- Query composition in `src/collection/QuerySet.ts`
