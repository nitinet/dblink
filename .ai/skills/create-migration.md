# Purpose

Plan and execute schema migration work for projects using DBLink.

# When to use

- Table/column constraints or indexes change.

# Prerequisites

- Migration tool choice in consumer app.

# Inputs

- Schema change request
- Backward compatibility constraints

# Outputs

- Forward migration
- Rollback migration
- Updated entity mappings

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Define schema delta and backward-compatibility plan.
2. Create migration script in consumer app tooling.
3. Update entity decorators (`@Table`, `@Column`, `@Id`, `@Foreign`) accordingly.
4. Update repository/service query usage as needed.
5. Add migration + regression tests.

# Validation

- Migration up/down works.
- DBLink queries still pass tests after migration.

# Common mistakes

- Updating entity decorators without schema migration.

# Related skills

- `create-repository`
- `create-test`
- `fix-bug`

# Example from repository

Not found in current codebase.
