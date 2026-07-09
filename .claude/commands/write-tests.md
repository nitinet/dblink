---
description: Write Vitest tests for dblink behavior (unit or integration)
argument-hint: [module/behavior to test]
---

Write tests for the following dblink behavior. Read @CLAUDE.md for architecture and the test setup.

## Target
$ARGUMENTS

## Test setup facts
- Runner: **Vitest** (`npm test` sets `TEST_DB_USER=$(whoami)`). `vitest.config.js` disables file parallelism and preloads `reflect-metadata`.
- **Unit-style** tests (decorators, expression/query composition, type mapping) run with **no database** — prefer these.
- **Integration** tests require a **live PostgreSQL** via `dblink-pg`; they create and tear down their own tables. Model these on `test/Integration.test.ts`.
- Entity fixtures live in `test/model/` (`Employee`, `Department`, `Order`) using `@decorators.Table/@Column/@Id/@Foreign`.

## Procedure
1. When testing a new behavior or bug, write the **failing test first**.
2. Add minimal entity fixtures/models; reuse `test/model/*` where possible.
3. For DB tests, create and clean up tables deterministically — leave no data that pollutes later cases.
4. Assert the success path, edge cases, **and** the error path (e.g. `Transaction Not Started`, `Invalid Join`, empty update fields).
5. Run targeted first (`npx vitest run <file>` or `-t "<name>"`), then the full suite.

## Done when
- The new test fails before the change and passes after.
- No flaky cleanup; typecheck stays clean.
