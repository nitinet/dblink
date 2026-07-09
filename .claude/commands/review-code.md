---
description: Review the current dblink changes for correctness, API stability, and performance
argument-hint: [optional: PR # or area to focus]
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(npx tsc:*), Bash(npm test:*)
---

Review the pending changes on this branch for this dblink ORM library. Read @CLAUDE.md for architecture. Start from `git diff` (and focus on: $ARGUMENTS if provided).

## Review focus
1. **Public API surface** — check `src/index.ts` exports and any decorator/metadata contract changes (`src/decorators/`, `Constants.ts`). Flag unintended breaking changes.
2. **Query semantics** — verify `TableSet`, `QuerySet`, and `JoinQuerySet` still build correct statements; check column↔field mapping and alias qualification in joins.
3. **Transaction safety** — `Context.initTransaction()` clone/relink correctness and `Connection` resource close on commit/rollback.
4. **Type safety** — no weakened generics or stray `any`; `npx tsc --noEmit` clean.
5. **Test coverage** — changed behavior is covered; integration impact on adapters considered.
6. **Performance** — watch `include()` N+1 expansion and join column growth.

## Checklist (must hold before approving)
- Scope minimal and focused; API changes intentional and documented (README updated if user-facing).
- Build passes (`npm run build`) and typecheck is clean.
- Tests added/updated; no critical/high defects remain.
- No unsafe SQL string concatenation; value operands stay parameterized.

Report findings by severity with concrete file:line references and required fixes.
