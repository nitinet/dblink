---
description: Refactor a dblink module for maintainability while preserving behavior
argument-hint: [module or code smell to refactor]
---

Refactor the following in this dblink ORM library, preserving all observable behavior. Read @CLAUDE.md for architecture.

## Target
$ARGUMENTS

## Procedure
1. **Pin current behavior with tests first.** If coverage around the target is thin, add characterization tests before touching code.
2. Identify extraction boundaries — helper methods or shared utilities. Existing precedent: `getAllFields()` / `getUpdateFields()` / `createQuerySet()` in `src/collection/TableSet.ts`, and the duplicated `getFieldColumnMap` / `isValidExpression` helpers across `QuerySet` and `JoinQuerySet` (prime dedup candidates).
3. Refactor incrementally in small steps. Keep public signatures (`src/index.ts` exports, class method shapes) stable unless the task is an explicit API change.
4. Re-run the full suite after each step: `npm test` (unit) and `npx tsc --noEmit`.

## Watch out
- Do not mix refactor and feature/behavior changes in one pass.
- No behavior regressions in existing tests; readability/complexity should measurably improve.
