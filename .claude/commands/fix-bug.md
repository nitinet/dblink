---
description: Fix a defect in dblink with minimal regression risk
argument-hint: [bug description / stack trace / failing test]
---

Fix the following bug in this dblink ORM library with the smallest safe change. Read @CLAUDE.md first for architecture and the query pipeline.

## Bug
$ARGUMENTS

## Procedure
1. **Reproduce first.** Write a focused failing test in `test/` (see `test/QueryBuilding.test.ts`, `test/Context.test.ts`, `test/workflow.test.ts` for patterns). If the repro needs a DB, note that `Integration.test.ts` requires a live PostgreSQL (`TEST_DB_USER=$(whoami)`).
2. **Classify the failing layer** — metadata/decorators, query composition (`TableSet`/`QuerySet`/`JoinQuerySet`), expression building (`src/exprBuilder/`), execution (`Context`/`Connection`), or result transformation (`transformer()`).
3. Apply the **smallest corrective change** in `src/**/*.ts`. Do not refactor unrelated code while patching.
4. Add/strengthen regression tests so the new test fails before the fix and passes after.
5. Run targeted tests, then the broader suite: `npx vitest run <file>` then `npm test`.
6. Confirm no public API contract break (`src/index.ts` exports; `npx tsc --noEmit`).

## Watch out
- Never edit generated `.js` — those are gitignored build output. Fix the `.ts` source only.
- Preserve API behavior unless the fix explicitly requires changing it.

## Deliver
Minimal code fix, a regression test, and a one-line root-cause note.
