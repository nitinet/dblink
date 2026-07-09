---
description: Implement a new feature in dblink, test-first with minimal API surface
argument-hint: [feature description / expected behavior]
---

Implement the following feature in this dblink ORM library. Read @CLAUDE.md for architecture first.

## Requirement
$ARGUMENTS

## Procedure
1. Clarify the **expected observable API behavior** (how a consumer calls it, what comes back).
2. Find a similar existing implementation to mirror — usually in `src/collection/` (query ops), `src/exprBuilder/` (operators/expressions), or `src/decorators/` (mapping). Match its patterns.
3. If entity mapping changes, update decorators/metadata (`src/decorators/`, `Constants.ts`) accordingly.
4. **Write failing tests first** for the expected behavior (unit-style; integration if it needs a DB). Then implement to satisfy them with the smallest query/collection surface change.
5. Keep changes coherent with the pipeline: decorator metadata → `DBSet` field maps → expression AST → `sql.Statement` → `Handler`.

## Coding rules
- Preserve TypeScript strictness; no weakening generics or public exports in `src/index.ts` unless the feature is an intentional API change.
- Keep ESM `.js` import suffixes on every relative import, even in `.ts` files.
- Reach core AST types via `dblink-core/src/...js` deep paths, following existing imports.

## Done when
- Behavior is validated by tests; `npm run build` and `npx tsc --noEmit` pass.
- README examples updated if public behavior changed; no unrelated changes.
