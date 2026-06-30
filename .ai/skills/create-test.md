# Purpose

Create effective tests for DBLink modules or downstream DBLink integrations.

# When to use

- Adding features or fixing bugs in ORM behavior.
- Validating consumer integration patterns.

# Prerequisites

- Vitest available.
- For integration tests: reachable PostgreSQL instance.

# Inputs

- Behavior under test
- Expected SQL/query results

# Outputs

- Unit-style tests for expression/query composition
- Integration tests for DB execution behavior

# Files normally modified

- `test/*.test.ts`
- `test/model/*.ts`
- `vitest.config.js` (if needed)

# Implementation Steps

1. Prefer reproducing bug/feature with a failing test first.
2. Add minimal fixtures/entity models.
3. For DB tests, create and cleanup tables deterministically.
4. Assert both behavior and edge-case errors.
5. Run targeted tests, then full suite.

# Validation

- New test fails before fix and passes after fix.
- No flaky cleanup behavior.

# Common mistakes

- Running integration tests without PostgreSQL.
- Leaving test data that pollutes later cases.

# Related skills

- `fix-bug`
- `review-code`

# Example from repository

- Workflow tests in `test/workflow.test.ts`
- Context transaction tests in `test/Context.test.ts`
- Query-building tests in `test/QueryBuilding.test.ts`
