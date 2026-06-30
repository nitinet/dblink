# Purpose

Design service-layer orchestration that uses DBLink context/table sets.

# When to use

- Application logic needs reusable DB operations.
- Multiple endpoints/jobs share data-access workflows.

# Prerequisites

- Consumer app structure has service layer.
- DBLink context initialized and available.

# Inputs

- Business rules
- Entity models
- Error handling requirements

# Outputs

- Service function signatures
- Transaction-safe data operations

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Define service method input/output types.
2. Use `TableSet` for CRUD and `QuerySet` for filtering/sorting.
3. Use `initTransaction()` for atomic multi-entity changes.
4. Return domain-safe errors from service layer.
5. Add tests for success and failure paths.

# Validation

- Service methods are deterministic and test-covered.
- Rollback occurs on failed transactional paths.

# Common mistakes

- Embedding business logic directly into route/controller code.
- Calling `commit()` without transaction initialization.

# Related skills

- `create-repository`
- `fix-bug`
- `create-test`

# Example from repository

Not found in current codebase for service layer.

Transaction workflow reference: `src/Context.ts` and `test/Context.test.ts`.
