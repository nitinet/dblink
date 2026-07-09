---
description: Improve dblink query/runtime performance without changing behavior
argument-hint: [slow scenario or query pattern]
---

Optimize the following performance issue in dblink (or in code using it) without changing functional results. Read @CLAUDE.md for the query pipeline.

## Scenario
$ARGUMENTS

## Procedure
1. **Measure baseline first** — latency, row count, memory, and query count. Never optimize before measuring.
2. Apply the relevant levers:
   - Narrow projection with `select([...])` so fewer columns are fetched/mapped.
   - Use `limit(size, index)` for pagination instead of loading all rows.
   - Prefer `stream()` over `list()` for large scans (memory).
   - Inspect `include()` and `join` paths for **N+1 expansion** — `transformer()` resolves each foreign key with its own query per row; batch or restructure where it dominates.
3. Confirm functional equivalence: same rows/shape as before.
4. Compare before/after metrics and add a regression test or benchmark where feasible.

## Watch out
- Don't break column↔field type mapping while pruning fields.
- Files usually touched: `src/collection/*.ts`, `test/*Integration*.ts`.
